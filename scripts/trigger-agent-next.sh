#!/usr/bin/env bash
# trigger-agent-next.sh — Triggers the configured reviewer agent to pick up next task.
# Token-optimized: card inlined in prompt.
# Usage: trigger-agent-next.sh

set -euo pipefail
shopt -s nullglob

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

BOARD_DIR="$KANBAN_ROOT/board"

# Resolve reviewer agent from config
REVIEWER_AGENT="$(get_reviewers | head -1)"
if [ -z "$REVIEWER_AGENT" ]; then
  echo "[$(date -Iseconds)] ERROR: no reviewer agent configured" >&2
  exit 1
fi

REVIEWER_EXEC_CMD="$(cfg ".agents[] | select(.id == \"${REVIEWER_AGENT}\") | .exec_command" "")"

# ── Find next eligible task ───────────────────────────────────────────────────

find_next_task() {
  # Collect all done task IDs
  local done_tasks=""
  for f in "$KANBAN_ROOT/archive/board/done"/*.md "$BOARD_DIR/done"/*.md; do
    [ -f "$f" ] || continue
    done_tasks="$done_tasks $(basename "$f" .md)"
  done

  for priority in critical high medium low; do
    for f in "$BOARD_DIR/backlog"/*.md; do
      local task_id task_priority deps dep
      task_id=$(basename "$f" .md)
      task_priority=$(grep '^priority:' "$f" | sed 's/^priority: *//')
      [ "$task_priority" = "$priority" ] || continue

      deps=$(grep '^depends_on:' "$f" | sed 's/^depends_on: *\[//;s/\]//;s/,/ /g;s/^ *//' || true)
      local all_resolved=true
      if [ -n "$deps" ]; then
        for dep in $deps; do
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
PROJECT_DIR="$(get_project_path "$project")"

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ]; then
  echo "[$(date -Iseconds)] ERROR: cannot resolve repo for project '$project' (task $NEXT_TASK)"
  exit 1
fi

echo "[$(date -Iseconds)] Next task: $NEXT_TASK - $title (project: $project, repo: $PROJECT_DIR)"

# Sync worktree
echo "[$(date -Iseconds)] Syncing reviewer worktree..."
if [ -x "$SCRIPTS_DIR/sync-agent-worktree.sh" ]; then
  "$SCRIPTS_DIR/sync-agent-worktree.sh" pull 2>&1 || true
fi

# Card content (full for new implementation)
CARD_CONTENT=$(cat "$TASK_FILE")

# Extract files mentioned in card
FILES_HINT=$(grep -oE '(backend|frontend|src|app|dashboard)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js)' "$TASK_FILE" | sort -u | head -20 || true)

# Load static instructions
STATIC_RULES=""
if [ -f "$SCRIPTS_DIR/prompts/agent-next.md" ]; then
  STATIC_RULES=$(cat "$SCRIPTS_DIR/prompts/agent-next.md")
fi

PROMPT="IMPLEMENT $NEXT_TASK — $title.

CARD:
$CARD_CONTENT

RELEVANT FILES (if mentioned):
$FILES_HINT

mv $TASK_FILE $BOARD_DIR/in-progress/$NEXT_TASK.md (claim)
Then mv $BOARD_DIR/in-progress/$NEXT_TASK.md $BOARD_DIR/review/$NEXT_TASK.md

$STATIC_RULES"

echo "[$(date -Iseconds)] Triggering $REVIEWER_AGENT for $NEXT_TASK..."

# ── Invoke reviewer agent ─────────────────────────────────────────────────────

if [ -z "$REVIEWER_EXEC_CMD" ] || [ "$REVIEWER_EXEC_CMD" = "null" ]; then
  echo "[$(date -Iseconds)] No exec_command configured for $REVIEWER_AGENT"
  SYSTEM_NAME="$(cfg '.system.name' 'kanbania' | tr '[:upper:] ' '[:lower:]-')"
  echo "$PROMPT" > "/tmp/${SYSTEM_NAME}-next-${NEXT_TASK}.txt"
  echo "[$(date -Iseconds)] Prompt saved to /tmp/${SYSTEM_NAME}-next-${NEXT_TASK}.txt"
  exit 0
fi

cmd="${REVIEWER_EXEC_CMD//\{\{working_dir\}\}/$PROJECT_DIR}"
cmd="${cmd//\{\{kanban_root\}\}/$KANBAN_ROOT}"
cmd_arr=()
read -ra cmd_arr <<< "$cmd"

(cd "$PROJECT_DIR" && "${cmd_arr[@]}" "$PROMPT")
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "[$(date -Iseconds)] WARNING: $REVIEWER_AGENT finished (exit=$EXIT_CODE)."
fi
