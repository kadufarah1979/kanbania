#!/usr/bin/env bash
# Triggers Codex to pick up next task from backlog.
# Token-optimized: card inlined in prompt (no --add-dir).
# Usage: trigger-codex-next.sh

set -euo pipefail
shopt -s nullglob

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
SCRIPTS_DIR="$KANBAN_DIR/scripts"
source "$SCRIPTS_DIR/lib-kanban.sh"

find_next_task() {
  # Check done in archive
  local done_tasks=""
  for f in "$KANBAN_DIR/archive/board/done"/*.md "$BOARD_DIR/done"/*.md; do
    [ -f "$f" ] || continue
    done_tasks="$done_tasks $(basename "$f" .md)"
  done

  for priority in critical high medium low; do
    for f in "$BOARD_DIR/backlog"/*.md; do
      local task_id
      task_id=$(basename "$f" .md)
      local task_priority
      task_priority=$(grep '^priority:' "$f" | sed 's/^priority: *//')

      [ "$task_priority" = "$priority" ] || continue

      local deps
      deps=$(grep '^depends_on:' "$f" | sed 's/^depends_on: *\[//;s/\]//')
      local all_resolved=true

      if [ -n "$deps" ] && [ "$deps" != "" ]; then
        IFS=',' read -ra dep_array <<< "$deps"
        for dep in "${dep_array[@]}"; do
          dep=$(echo "$dep" | tr -d ' ')
          if ! echo "$done_tasks" | grep -qw "$dep"; then
            all_resolved=false
            break
          fi
        done
      fi

      if $all_resolved; then
        echo "$task_id"
        return 0
      fi
    done
  done

  echo ""
  return 1
}

NEXT_TASK=$(find_next_task || true)

if [ -z "$NEXT_TASK" ]; then
  echo "[$(date -Iseconds)] No eligible tasks found in backlog"
  exit 0
fi

TASK_FILE="$BOARD_DIR/backlog/$NEXT_TASK.md"
title=$(grep '^title:' "$TASK_FILE" | sed 's/^title: *"//;s/"$//')
project=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')
PROJECT_DIR=$(get_project_repo "$project")

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ]; then
  echo "[$(date -Iseconds)] ERROR: cannot resolve repo for project '$project' (task $NEXT_TASK)"
  exit 1
fi

echo "[$(date -Iseconds)] Next task: $NEXT_TASK - $title (project: $project, repo: $PROJECT_DIR)"

# Sync worktree
echo "[$(date -Iseconds)] Syncing codex worktree..."
"$SCRIPTS_DIR/sync-codex-worktree.sh" pull 2>&1 || true

# Card content (full for new implementation)
CARD_CONTENT=$(cat "$TASK_FILE")

# Extract files mentioned in card
FILES_HINT=$(grep -oE '(backend|frontend)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js)' "$TASK_FILE" | sort -u | head -20 || true)

# Load static instructions from template
STATIC_RULES=$(cat "$SCRIPTS_DIR/prompts/codex-next.md")

PROMPT="IMPLEMENTAR $NEXT_TASK — $title.

CARD:
$CARD_CONTENT

ARQUIVOS RELEVANTES (se mencionados):
$FILES_HINT

mv $TASK_FILE $BOARD_DIR/in-progress/$NEXT_TASK.md (claim)
Depois mv $BOARD_DIR/in-progress/$NEXT_TASK.md $BOARD_DIR/review/$NEXT_TASK.md

$STATIC_RULES"

echo "[$(date -Iseconds)] Triggering Codex for $NEXT_TASK..."

(cd "$PROJECT_DIR" && codex exec \
  --full-auto \
  --add-dir "$KANBAN_DIR" \
  "$PROMPT")

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "[$(date -Iseconds)] WARNING: Codex finished (exit=$EXIT_CODE)."
fi
