#!/usr/bin/env bash
# trigger-agent-review.sh — Triggers the configured reviewer agent to QA-review a task.
#
# Usage:
#   trigger-agent-review.sh <TASK-ID>    — review specific task
#   trigger-agent-review.sh              — review next pending task

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

BOARD_DIR="$KANBAN_ROOT/board"
SYSTEM_NAME="$(cfg '.system.name' 'kanbania' | tr '[:upper:] ' '[:lower:]-')"
MAX_DIFF_LINES=150
MAX_GATE_LINES=30

# Resolve reviewer agent from config
REVIEWER_AGENT="$(get_reviewers | head -1)"
if [ -z "$REVIEWER_AGENT" ]; then
  echo "[$(date -Iseconds)] ERROR: no reviewer agent configured" >&2
  exit 1
fi

# Resolve exec_command from config ({{working_dir}} and {{kanban_root}} are placeholders)
REVIEWER_EXEC_CMD="$(cfg ".agents[] | select(.id == \"${REVIEWER_AGENT}\") | .exec_command" "")"

# ── Helpers ───────────────────────────────────────────────────────────────────

has_reviewer_pending() {
  local file="$1" reviewer
  while IFS= read -r reviewer; do
    grep -q "review_requested_from:.*${reviewer}" "$file" 2>/dev/null && return 0
  done < <(get_reviewers)
  return 1
}

invoke_reviewer() {
  local working_dir="$1" board_dir="$2" prompt="$3"

  if [ -z "$REVIEWER_EXEC_CMD" ] || [ "$REVIEWER_EXEC_CMD" = "null" ]; then
    echo "[$(date -Iseconds)] No exec_command configured for $REVIEWER_AGENT. Saving prompt to file."
    local prompt_file="/tmp/${SYSTEM_NAME}-review-${task_id}.txt"
    echo "$prompt" > "$prompt_file"
    echo "[$(date -Iseconds)] Prompt saved to $prompt_file"
    return 0
  fi

  # Substitute placeholders
  local cmd="${REVIEWER_EXEC_CMD//\{\{working_dir\}\}/$working_dir}"
  cmd="${cmd//\{\{kanban_root\}\}/$KANBAN_ROOT}"

  # Split cmd into array and invoke with prompt as final arg
  local cmd_arr=()
  read -ra cmd_arr <<< "$cmd"
  (cd "$working_dir" && "${cmd_arr[@]}" "$prompt")
}

# ── Review one task ───────────────────────────────────────────────────────────

review_task() {
  local task_id="$1"
  local task_file
  task_file=$(find "$KANBAN_ROOT" -name "$task_id.md" -path "*/board/review/*" | head -1)

  if [ ! -f "$task_file" ]; then
    echo "[$(date -Iseconds)] ERROR: $task_id.md not found in any board/review/"
    return 1
  fi

  local title project project_repo
  title=$(grep '^title:' "$task_file" | sed 's/^title: *"//;s/"$//')
  project=$(grep '^project:' "$task_file" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')

  if [ -z "$project" ]; then
    echo "[$(date -Iseconds)] ERROR: no project field in $task_file"
    return 1
  fi

  # Resolve project repo from config.local.yaml
  project_repo="$(get_project_path "$project")"
  if [ -z "$project_repo" ] || [ ! -d "$project_repo" ]; then
    echo "[$(date -Iseconds)] WARN: cannot resolve repo for project '$project'; using KANBAN_ROOT"
    project_repo="$KANBAN_ROOT"
  fi

  echo "[$(date -Iseconds)] Reviewing: $task_id - $title (project: $project)"

  # Register heartbeat
  if [ -x "$SCRIPTS_DIR/agent-heartbeat.sh" ]; then
    bash "$SCRIPTS_DIR/agent-heartbeat.sh" "$REVIEWER_AGENT" "$PPID" || true
  fi

  # Worktree path for reviewer (from config.local.yaml)
  local wt_dir
  wt_dir="$(get_project_worktree "$project" "$REVIEWER_AGENT")"
  if [ -z "$wt_dir" ]; then
    wt_dir="/tmp/${SYSTEM_NAME}-${REVIEWER_AGENT}-${project}"
  fi

  # Run pre-review gates if available (truncated to avoid bloating prompt)
  local GATE_RESULTS=""
  if [ -x "$SCRIPTS_DIR/pre-review-check.sh" ]; then
    GATE_RESULTS=$("$SCRIPTS_DIR/pre-review-check.sh" "$task_id" 2>&1 | head -"$MAX_GATE_LINES") || true
  fi

  # Card slice: review mode
  local CARD_CONTENT=""
  if [ -x "$SCRIPTS_DIR/card-slice.sh" ]; then
    CARD_CONTENT=$("$SCRIPTS_DIR/card-slice.sh" "$task_id" review)
  else
    CARD_CONTENT=$(cat "$task_file")
  fi

  # Generate diff from task branch
  local CODE_DIFF=""
  if [ -d "$project_repo/.git" ]; then
    CODE_DIFF=$(git -C "$project_repo" diff "main...task/$task_id" 2>/dev/null | head -"$MAX_DIFF_LINES" || true)
  fi

  # Load system prompt template if available
  local SYSTEM_PROMPT=""
  local prompt_file="$SCRIPTS_DIR/prompts/agent-review.md"
  if [ -f "$prompt_file" ]; then
    SYSTEM_PROMPT=$(sed "s/{TASK_ID}/$task_id/g" "$prompt_file")
  fi

  # Derive done/in-progress paths from the card file location
  local review_dir
  review_dir=$(dirname "$task_file")
  local board_dir
  board_dir=$(dirname "$review_dir")
  local done_path="${board_dir}/done/${task_id}.md"
  local inprogress_path="${board_dir}/in-progress/${task_id}.md"

  # Build prompt
  local PROMPT="QA $task_id (project: $project).

Card file (canonical path): $task_file
MANDATORY after review — do ONE of these immediately, no confirmation needed:
  APPROVED  → mv \"$task_file\" \"$done_path\" then update card acted_by + git add + git commit + git push
  REJECTED  → mv \"$task_file\" \"$inprogress_path\" then update card acted_by (qa_changes_requested) + git add + git commit + git push

Kanban root: ${KANBAN_ROOT}
Project repo: ${project_repo}

CARD:
$CARD_CONTENT

GATES (tests already executed — do NOT re-run):
$GATE_RESULTS"

  if [ -n "$CODE_DIFF" ]; then
    PROMPT="${PROMPT}

DIFF (main...task/$task_id):
$CODE_DIFF"
  fi

  local FULL_PROMPT="${SYSTEM_PROMPT:+$SYSTEM_PROMPT

}$PROMPT"

  invoke_reviewer "$project_repo" "$board_dir" "$FULL_PROMPT"

  echo "[$(date -Iseconds)] Review complete for $task_id"
}

# ── Main ──────────────────────────────────────────────────────────────────────

if [ $# -gt 0 ]; then
  review_task "$1"
else
  found=false
  sortable=()
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    has_reviewer_pending "$f" || continue
    task_id=$(basename "$f" .md)
    pri=$(grep '^priority:' "$f" | head -1 | sed 's/^priority:\s*//' | tr -d '"' | tr -d ' ')
    case "${pri:-medium}" in
      critical) rank=0 ;;
      high)     rank=1 ;;
      medium)   rank=2 ;;
      low)      rank=3 ;;
      *)        rank=2 ;;
    esac
    num="${task_id#TASK-}"
    sortable+=("$(printf '%d|%08d|%s' "$rank" "$((10#$num))" "$task_id")")
  done < <(find "$KANBAN_ROOT" -path "*/board/review/*.md" 2>/dev/null | sort)
  if [ "${#sortable[@]}" -gt 0 ]; then
    found=true
    while IFS='|' read -r _ _ task_id <&3; do
      review_task "$task_id" </dev/null
    done 3< <(printf '%s\n' "${sortable[@]}" | sort -t'|' -k1,1n -k2,2n)
  fi
  if ! $found; then
    echo "[$(date -Iseconds)] No tasks pending QA review"
  fi
fi
