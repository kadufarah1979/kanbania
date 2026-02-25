#!/usr/bin/env bash
# Triggers Codex to fix a rejected task.
# Token-optimized v3: extracts pendencias, generates targeted file snippets.
# Codex receives pendencias + relevant code context without reading full files.
# Usage: trigger-codex-fix.sh <TASK-ID>

set -euo pipefail

TASK_ID="${1:?Usage: trigger-codex-fix.sh <TASK-ID>}"
KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
SCRIPTS_DIR="$KANBAN_DIR/scripts"
source "$SCRIPTS_DIR/lib-kanban.sh"
TASK_FILE="$BOARD_DIR/in-progress/$TASK_ID.md"
CONTEXT_LINES=15  # lines above/below each referenced line

if [ ! -f "$TASK_FILE" ]; then
  echo "ERROR: $TASK_FILE not found. Task must be in in-progress/"
  exit 1
fi

title=$(grep '^title:' "$TASK_FILE" | sed 's/^title: *"//;s/"$//')
project=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')
PROJECT_DIR=$(get_project_repo "$project")

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ]; then
  echo "[$(date -Iseconds)] ERROR: cannot resolve repo for project '$project' (task $TASK_ID)"
  exit 1
fi

echo "[$(date -Iseconds)] Triggering Codex to fix: $TASK_ID - $title (project: $project, repo: $PROJECT_DIR)"

# Sync worktree
echo "[$(date -Iseconds)] Syncing codex worktree..."
"$SCRIPTS_DIR/sync-codex-worktree.sh" pull 2>&1 || true

# ---- Extract Pendencias section from card ----
PENDENCIAS=$(sed -n '/^## Pendencias/,/^## /{ /^## Pendencias/d; /^## /d; p; }' "$TASK_FILE" | sed '/^$/d')
if [ -z "$PENDENCIAS" ]; then
  # Fallback: try QA Notes section
  PENDENCIAS=$(sed -n '/^## QA Notes/,/^## /{ /^## QA Notes/d; /^## /d; p; }' "$TASK_FILE" | sed '/^$/d')
fi

# ---- Extract file:line references from pendencias ----
# Matches patterns like `frontend/src/foo.tsx:42` or backend/app/foo.py:85
FILE_LINES=$(echo "$PENDENCIAS" | grep -oE '(backend|frontend)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css):[0-9]+' | sort -u || true)

# Also extract file paths without line numbers (fallback)
FILES_ONLY=$(echo "$PENDENCIAS" | grep -oE '(backend|frontend)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css)' | sort -u || true)
if [ -z "$FILES_ONLY" ]; then
  FILES_ONLY=$(grep -oE '(backend|frontend)/[a-zA-Z0-9/_.-]+\.(py|tsx?|js|css)' "$TASK_FILE" | sort -u | head -20 || true)
fi

# ---- Generate targeted code snippets around referenced lines ----
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
--- $file_path (linhas $start-$end, ref linha $line_num) ---
$snippet
"
    fi
  done <<< "$FILE_LINES"
fi

# ---- Fallback: git diff for files without line refs ----
FALLBACK_DIFF=""
if [ -z "$CODE_CONTEXT" ] && [ -n "$FILES_ONLY" ]; then
  FALLBACK_DIFF=$(cd "$PROJECT_DIR" && git diff HEAD -- $FILES_ONLY 2>/dev/null | head -200 || true)
  if [ -z "$FALLBACK_DIFF" ]; then
    FALLBACK_DIFF=$(cd "$PROJECT_DIR" && git diff HEAD~5..HEAD -- $FILES_ONLY 2>/dev/null | head -200 || true)
  fi
fi

# ---- Load static instructions from template ----
STATIC_RULES=$(cat "$SCRIPTS_DIR/prompts/codex-fix.md")

# ---- Build prompt (dynamic content only) ----
PROMPT="FIX $TASK_ID — $title.

PENDENCIAS A CORRIGIR:
$PENDENCIAS

ARQUIVOS:
$FILES_ONLY
"

if [ -n "$CODE_CONTEXT" ]; then
  PROMPT="${PROMPT}
CODIGO ATUAL (trechos em torno das linhas referenciadas):
$CODE_CONTEXT"
elif [ -n "$FALLBACK_DIFF" ]; then
  PROMPT="${PROMPT}
DIFF ATUAL:
$FALLBACK_DIFF"
fi

PROMPT="${PROMPT}
mv $TASK_FILE $BOARD_DIR/review/$TASK_ID.md

$STATIC_RULES"

echo "[$(date -Iseconds)] Running Codex fix for $TASK_ID..."
echo "[$(date -Iseconds)] Pendencias: $(echo "$PENDENCIAS" | wc -l) lines, Context: $(echo "$CODE_CONTEXT" | wc -l) lines" >&2

(cd "$PROJECT_DIR" && codex exec \
  --full-auto \
  --add-dir "$KANBAN_DIR" \
  "$PROMPT")

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] || [ -f "$TASK_FILE" ]; then
  echo "[$(date -Iseconds)] WARNING: Codex fix finished (exit=$EXIT_CODE) but task may still be in-progress."
fi
