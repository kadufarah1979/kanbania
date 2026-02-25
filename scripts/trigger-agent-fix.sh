#!/usr/bin/env bash
# trigger-agent-fix.sh — Triggers the configured reviewer agent to fix a rejected task.
# Token-optimized: extracts pendencias, generates targeted file snippets.
# Usage: trigger-agent-fix.sh <TASK-ID>

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

TASK_ID="${1:?Usage: trigger-agent-fix.sh <TASK-ID>}"
BOARD_DIR="$KANBAN_ROOT/board"
TASK_FILE="$BOARD_DIR/in-progress/$TASK_ID.md"
CONTEXT_LINES=15  # lines above/below each referenced line

# Resolve reviewer agent from config
REVIEWER_AGENT="$(get_reviewers | head -1)"
if [ -z "$REVIEWER_AGENT" ]; then
  echo "[$(date -Iseconds)] ERROR: no reviewer agent configured" >&2
  exit 1
fi

REVIEWER_EXEC_CMD="$(cfg ".agents[] | select(.id == \"${REVIEWER_AGENT}\") | .exec_command" "")"

# ── Validate ──────────────────────────────────────────────────────────────────

if [ ! -f "$TASK_FILE" ]; then
  echo "ERROR: $TASK_FILE not found. Task must be in in-progress/"
  exit 1
fi

title=$(grep '^title:' "$TASK_FILE" | sed 's/^title: *"//;s/"$//')
project=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')
PROJECT_DIR="$(get_project_path "$project")"

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ]; then
  echo "[$(date -Iseconds)] ERROR: cannot resolve repo for project '$project' (task $TASK_ID)"
  exit 1
fi

echo "[$(date -Iseconds)] Triggering $REVIEWER_AGENT to fix: $TASK_ID - $title (project: $project, repo: $PROJECT_DIR)"

# Sync worktree
echo "[$(date -Iseconds)] Syncing reviewer worktree..."
if [ -x "$SCRIPTS_DIR/sync-agent-worktree.sh" ]; then
  "$SCRIPTS_DIR/sync-agent-worktree.sh" pull 2>&1 || true
fi

# ── Extract Pendencias section from card ──────────────────────────────────────

PENDENCIAS=$(sed -n '/^## Pendencias/,/^## /{ /^## Pendencias/d; /^## /d; p; }' "$TASK_FILE" | sed '/^$/d')
if [ -z "$PENDENCIAS" ]; then
  # Fallback: try QA Notes section
  PENDENCIAS=$(sed -n '/^## QA Notes/,/^## /{ /^## QA Notes/d; /^## /d; p; }' "$TASK_FILE" | sed '/^$/d')
fi

# ── Extract file:line references ──────────────────────────────────────────────

FILE_LINES=$(echo "$PENDENCIAS" | grep -oE '(backend|frontend|src|app|dashboard)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css):[0-9]+' | sort -u || true)
FILES_ONLY=$(echo "$PENDENCIAS" | grep -oE '(backend|frontend|src|app|dashboard)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css)' | sort -u || true)
if [ -z "$FILES_ONLY" ]; then
  FILES_ONLY=$(grep -oE '(backend|frontend|src|app|dashboard)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css)' "$TASK_FILE" | sort -u | head -20 || true)
fi

# ── Generate targeted code snippets ──────────────────────────────────────────

CODE_CONTEXT=""
if [ -n "$FILE_LINES" ]; then
  while IFS= read -r ref; do
    file_path="${ref%%:*}"
    line_num="${ref##*:}"
    full_path="$PROJECT_DIR/$file_path"

    if [ -f "$full_path" ]; then
      start=$((line_num - CONTEXT_LINES))
      [ $start -lt 1 ] && start=1
      end=$((line_num + CONTEXT_LINES))
      snippet=$(awk "NR>=$start && NR<=$end { printf \"%4d| %s\n\", NR, \$0 }" "$full_path")
      CODE_CONTEXT="${CODE_CONTEXT}
--- $file_path (lines $start-$end, ref line $line_num) ---
$snippet
"
    fi
  done <<< "$FILE_LINES"
fi

# Fallback: git diff for files without line refs
FALLBACK_DIFF=""
if [ -z "$CODE_CONTEXT" ] && [ -n "$FILES_ONLY" ]; then
  FALLBACK_DIFF=$(git -C "$PROJECT_DIR" diff HEAD -- $FILES_ONLY 2>/dev/null | head -200 || true)
  if [ -z "$FALLBACK_DIFF" ]; then
    FALLBACK_DIFF=$(git -C "$PROJECT_DIR" diff HEAD~5..HEAD -- $FILES_ONLY 2>/dev/null | head -200 || true)
  fi
fi

# ── Load static instructions ──────────────────────────────────────────────────

STATIC_RULES=""
if [ -f "$SCRIPTS_DIR/prompts/agent-fix.md" ]; then
  STATIC_RULES=$(cat "$SCRIPTS_DIR/prompts/agent-fix.md")
fi

# ── Build prompt ──────────────────────────────────────────────────────────────

PROMPT="FIX $TASK_ID — $title.

ISSUES TO FIX:
$PENDENCIAS

FILES:
$FILES_ONLY
"

if [ -n "$CODE_CONTEXT" ]; then
  PROMPT="${PROMPT}
CURRENT CODE (around referenced lines):
$CODE_CONTEXT"
elif [ -n "$FALLBACK_DIFF" ]; then
  PROMPT="${PROMPT}
CURRENT DIFF:
$FALLBACK_DIFF"
fi

PROMPT="${PROMPT}
mv $TASK_FILE $BOARD_DIR/review/$TASK_ID.md

$STATIC_RULES"

echo "[$(date -Iseconds)] Running $REVIEWER_AGENT fix for $TASK_ID..."
echo "[$(date -Iseconds)] Pendencias: $(echo "$PENDENCIAS" | wc -l) lines, Context: $(echo "$CODE_CONTEXT" | wc -l) lines" >&2

# ── Invoke reviewer agent ─────────────────────────────────────────────────────

if [ -z "$REVIEWER_EXEC_CMD" ] || [ "$REVIEWER_EXEC_CMD" = "null" ]; then
  echo "[$(date -Iseconds)] No exec_command configured for $REVIEWER_AGENT"
  SYSTEM_NAME="$(cfg '.system.name' 'kanbania' | tr '[:upper:] ' '[:lower:]-')"
  echo "$PROMPT" > "/tmp/${SYSTEM_NAME}-fix-${TASK_ID}.txt"
  echo "[$(date -Iseconds)] Prompt saved to /tmp/${SYSTEM_NAME}-fix-${TASK_ID}.txt"
  exit 0
fi

cmd="${REVIEWER_EXEC_CMD//\{\{working_dir\}\}/$PROJECT_DIR}"
cmd="${cmd//\{\{kanban_root\}\}/$KANBAN_ROOT}"
cmd_arr=()
read -ra cmd_arr <<< "$cmd"

(cd "$PROJECT_DIR" && "${cmd_arr[@]}" "$PROMPT")
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] || [ -f "$TASK_FILE" ]; then
  echo "[$(date -Iseconds)] WARNING: $REVIEWER_AGENT fix finished (exit=$EXIT_CODE) but task may still be in-progress."
fi
