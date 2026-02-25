#!/usr/bin/env bash
# Triggers Codex to QA-review a task using isolated worktree.
#
# Usage:
#   trigger-codex-review.sh <TASK-ID>    — review specific task
#   trigger-codex-review.sh              — review next pending task
#
# Determines project from the card, creates worktree via codex-qa-session.sh,
# and invokes codex with full-auto in the project repo.

set -euo pipefail

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
SCRIPTS_DIR="$KANBAN_DIR/scripts"
source "$SCRIPTS_DIR/lib-kanban.sh"
MAX_DIFF_LINES=300

review_task() {
  local task_id="$1"
  local task_file="$BOARD_DIR/review/$task_id.md"

  if [ ! -f "$task_file" ]; then
    echo "[$(date -Iseconds)] ERROR: $task_file not found"
    return 1
  fi

  local title project project_repo
  title=$(grep '^title:' "$task_file" | sed 's/^title: *"//;s/"$//')
  project=$(grep '^project:' "$task_file" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')

  if [ -z "$project" ]; then
    echo "[$(date -Iseconds)] ERROR: no project field in $task_file"
    return 1
  fi

  project_repo=$(get_project_repo "$project")
  if [ -z "$project_repo" ]; then
    # Fallback: try common paths
    for candidate in "/home/carlosfarah/Projects/$project" "/home/carlosfarah/kanbania"; do
      if [ -d "$candidate/.git" ]; then
        project_repo="$candidate"
        break
      fi
    done
  fi

  echo "[$(date -Iseconds)] Reviewing: $task_id - $title (project: $project)"

  # Register heartbeat so dashboard shows codex as active
  bash "$SCRIPTS_DIR/agent-heartbeat.sh" codex reviewing "$task_id" "QA: $title"

  # Setup isolated worktree for kanban operations
  local session_output
  session_output=$(bash "$SCRIPTS_DIR/codex-qa-session.sh" "$project" 2>&1) || true
  local wt_dir="/tmp/kanbania-codex-$project"

  # Run pre-review gates if available
  local GATE_RESULTS=""
  if [ -x "$SCRIPTS_DIR/pre-review-check.sh" ]; then
    GATE_RESULTS=$("$SCRIPTS_DIR/pre-review-check.sh" "$task_id" 2>&1) || true
  fi

  # Card slice: review mode (frontmatter + descricao + criterios, sem historico)
  local CARD_CONTENT
  CARD_CONTENT=$("$SCRIPTS_DIR/card-slice.sh" "$task_id" review)

  # Generate diff from task branch
  local CODE_DIFF=""
  if [ -n "$project_repo" ] && [ -d "$project_repo/.git" ]; then
    CODE_DIFF=$(cd "$project_repo" && git diff "main...task/$task_id" 2>/dev/null | head -$MAX_DIFF_LINES || true)
  fi

  # Static rules from template
  local SYSTEM_PROMPT
  SYSTEM_PROMPT=$(sed "s/{TASK_ID}/$task_id/g" "$SCRIPTS_DIR/prompts/codex-review.md")

  # Build prompt (dynamic content only)
  local PROMPT="QA $task_id (projeto: $project).

Worktree kanban: $wt_dir
Repo do projeto: ${project_repo:-nao encontrado}

CARD:
$CARD_CONTENT

GATES (testes ja executados — NAO rode novamente):
$GATE_RESULTS"

  if [ -n "$CODE_DIFF" ]; then
    PROMPT="${PROMPT}

DIFF (main...task/$task_id):
$CODE_DIFF"
  fi

  # Invoke codex
  if command -v codex &>/dev/null; then
    (cd "${project_repo:-$wt_dir}" && codex exec \
      --full-auto \
      --sandbox danger-full-access \
      --add-dir "$wt_dir" \
      "$SYSTEM_PROMPT

$PROMPT")
  else
    echo "[$(date -Iseconds)] codex CLI not found. Manual review needed."
    echo "$PROMPT" > "/tmp/codex-review-$task_id.txt"
    echo "[$(date -Iseconds)] Prompt saved to /tmp/codex-review-$task_id.txt"
  fi

  # Clear heartbeat and cleanup worktree
  bash "$SCRIPTS_DIR/agent-heartbeat.sh" --clear codex
  bash "$SCRIPTS_DIR/codex-qa-session.sh" --cleanup "$project" 2>/dev/null || true
}

# --- Main ---
if [ $# -gt 0 ]; then
  review_task "$1"
else
  found=false
  for f in "$BOARD_DIR/review"/*.md; do
    [ -f "$f" ] || continue
    grep -q 'review_requested_from:.*codex' "$f" || continue
    task_id=$(basename "$f" .md)
    found=true
    review_task "$task_id"
    break  # WIP 1: one task at a time
  done
  if ! $found; then
    echo "[$(date -Iseconds)] No tasks pending QA review"
  fi
fi
