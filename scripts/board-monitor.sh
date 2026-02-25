#!/usr/bin/env bash
# board-monitor.sh — Monitors all board columns, sends notifications on status
# changes, and writes trigger files for tasks entering review.
#
# Usage: board-monitor.sh [--interval <seconds>]

set -euo pipefail
shopt -s nullglob

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

BOARD_DIR="$KANBAN_ROOT/board"

# System name for log files and trigger dir (no hardcoded "aquabook")
SYSTEM_NAME="$(cfg '.system.name' 'kanbania' | tr '[:upper:] ' '[:lower:]-')"

TRIGGER_DIR="/tmp/${SYSTEM_NAME}-review-triggers"
TRIGGER_LOG="/tmp/${SYSTEM_NAME}-trigger.log"
POLL_INTERVAL=10

# Load columns from config
mapfile -t COLUMNS < <(get_columns)

# ── Flags ────────────────────────────────────────────────────────────────────

while [ $# -gt 0 ]; do
  case "$1" in
    --interval) POLL_INTERVAL="${2:?missing value for --interval}"; shift 2 ;;
    *) echo "[board-monitor] Unknown argument: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$TRIGGER_DIR"

# ── Helpers ───────────────────────────────────────────────────────────────────

update_agent_status() {
  "$SCRIPTS_DIR/update-agent-status.sh" "$@" 2>/dev/null || true
}

status_label() {
  case "$1" in
    backlog)     echo "Backlog" ;;
    in-progress) echo "In Progress" ;;
    review)      echo "In Review" ;;
    done)        echo "Done" ;;
    *)           echo "$1" ;;
  esac
}

status_icon() {
  case "$1" in
    backlog)     echo "document-new" ;;
    in-progress) echo "media-playback-start" ;;
    review)      echo "dialog-question" ;;
    done)        echo "emblem-default" ;;
    *)           echo "dialog-information" ;;
  esac
}

status_urgency() {
  case "$1" in
    review)      echo "critical" ;;
    in-progress) echo "normal" ;;
    done)        echo "low" ;;
    *)           echo "normal" ;;
  esac
}

get_task_title() {
  local file="$1"
  grep '^title:' "$file" 2>/dev/null | sed 's/^title: *"//;s/"$//'
}

get_task_assigned() {
  local file="$1"
  grep '^assigned_to:' "$file" 2>/dev/null | sed 's/^assigned_to: *//'
}

scan_column() {
  local col="$1"
  local dir="$BOARD_DIR/$col"
  [ -d "$dir" ] || return 0
  for f in "$dir"/*.md; do
    local task
    task=$(basename "$f" .md)
    echo "$task=$col"
  done
}

# Get the configured reviewer agent names (one per line)
_reviewers="$(get_reviewers)"

# Detect if a reviewer agent name appears in review_requested_from field
has_reviewer_pending() {
  local file="$1"
  local reviewer
  while IFS= read -r reviewer; do
    grep -q "review_requested_from:.*${reviewer}" "$file" 2>/dev/null && return 0
  done <<< "$_reviewers"
  return 1
}

# ── Initial snapshot (no notifications on startup) ───────────────────────────

declare -A TASK_STATUS

for col in "${COLUMNS[@]}"; do
  while IFS='=' read -r task col_val; do
    TASK_STATUS["$task"]="$col_val"
  done < <(scan_column "$col")
done

echo "[$(date -Iseconds)] Board monitor started. Tracking ${#TASK_STATUS[@]} tasks."
echo "[$(date -Iseconds)] Polling every ${POLL_INTERVAL}s. Trigger dir: $TRIGGER_DIR"

# ── Main poll loop ────────────────────────────────────────────────────────────

while true; do
  sleep "$POLL_INTERVAL"

  declare -A CURRENT_STATUS=()

  for col in "${COLUMNS[@]}"; do
    while IFS='=' read -r task col_val; do
      CURRENT_STATUS["$task"]="$col_val"
    done < <(scan_column "$col")
  done

  # Detect changes
  for task in "${!CURRENT_STATUS[@]}"; do
    new_col="${CURRENT_STATUS[$task]}"
    old_col="${TASK_STATUS[$task]:-}"

    if [ "$old_col" != "$new_col" ]; then
      file="$BOARD_DIR/$new_col/$task.md"
      title=$(get_task_title "$file")
      assigned=$(get_task_assigned "$file")
      new_label=$(status_label "$new_col")
      icon=$(status_icon "$new_col")
      urgency=$(status_urgency "$new_col")
      system_label="$(cfg '.system.name' 'Kanbania')"

      if [ -z "$old_col" ]; then
        summary="${system_label} - New Task"
        body="${task}: ${title} | Status: ${new_label} | Assigned: ${assigned}"
      else
        old_label=$(status_label "$old_col")
        summary="${system_label} - Status Changed"
        body="${task}: ${title} | ${old_label} -> ${new_label} | Assigned: ${assigned}"
      fi

      notify "$urgency" "$summary" "$body"
      echo "[$(date -Iseconds)] $task: ${old_col:-new} -> $new_col ($title)"

      # Trigger reviewer agent QA when task enters review
      if [ "$new_col" = "review" ] && has_reviewer_pending "$file"; then
        echo "$task" > "$TRIGGER_DIR/$task"
        echo "[$(date -Iseconds)] TRIGGER: $task entered review, launching reviewer agent"
        if [ -x "$SCRIPTS_DIR/trigger-agent-review.sh" ]; then
          nohup "$SCRIPTS_DIR/trigger-agent-review.sh" "$task" >> "$TRIGGER_LOG" 2>&1 &
        fi
      fi

      # Update reviewer agent status when task moves to in-progress
      local_reviewer_agent="$(get_reviewers | head -1)"
      if [ "$new_col" = "in-progress" ] && [ "$assigned" = "$local_reviewer_agent" ]; then
        update_agent_status "$local_reviewer_agent" "working" "$task" "Working: $title"
      fi

      # Reset implementer to idle when review column empties
      if [ "$old_col" = "review" ] && [ "$new_col" != "review" ]; then
        review_count=$(ls "$BOARD_DIR/review"/*.md 2>/dev/null | wc -l || echo 0)
        if [ "$review_count" -eq 0 ]; then
          update_agent_status "$KB_AGENT" "idle" "" "Waiting for review tasks"
        fi
      fi

      # Trigger CI/CD re-deploy when a cicd-fix task moves to done
      if [ "$new_col" = "done" ] && grep -q 'labels:.*cicd-fix' "$file" 2>/dev/null; then
        echo "[$(date -Iseconds)] TRIGGER: cicd-fix $task approved, triggering pipeline re-deploy"
        if [ -x "$SCRIPTS_DIR/cicd-trigger-pipeline.sh" ]; then
          nohup "$SCRIPTS_DIR/cicd-trigger-pipeline.sh" "$task" >> "$TRIGGER_LOG" 2>&1 &
        fi
      fi

      # Merge reviewer worktree into main when a task moves to done
      if [ "$new_col" = "done" ]; then
        echo "[$(date -Iseconds)] Merging reviewer worktree into main..."
        if [ -x "$SCRIPTS_DIR/sync-agent-worktree.sh" ]; then
          "$SCRIPTS_DIR/sync-agent-worktree.sh" merge >> "$TRIGGER_LOG" 2>&1 || true
        fi
        # Check no reviewer task is already in-progress
        reviewer_in_progress=false
        for ip_file in "$BOARD_DIR/in-progress"/*.md; do
          ip_assigned=$(get_task_assigned "$ip_file")
          if [ "$ip_assigned" = "$local_reviewer_agent" ]; then
            reviewer_in_progress=true
            break
          fi
        done
        if ! $reviewer_in_progress; then
          echo "[$(date -Iseconds)] TRIGGER: task done, launching reviewer agent for next task"
          if [ -x "$SCRIPTS_DIR/trigger-agent-next.sh" ]; then
            nohup "$SCRIPTS_DIR/trigger-agent-next.sh" >> "$TRIGGER_LOG" 2>&1 &
          fi
        fi
      fi

      # Trigger reviewer fix when task moves back to in-progress with changes_requested
      if [ "$new_col" = "in-progress" ] && [ "$assigned" = "$local_reviewer_agent" ]; then
        last_action=$(grep 'action:' "$file" | head -1 | sed 's/.*action: *//')
        if [ "$last_action" = "changes_requested" ]; then
          echo "[$(date -Iseconds)] TRIGGER: changes requested, launching reviewer fix for $task"
          if [ -x "$SCRIPTS_DIR/trigger-agent-fix.sh" ]; then
            nohup "$SCRIPTS_DIR/trigger-agent-fix.sh" "$task" >> "$TRIGGER_LOG" 2>&1 &
          fi
        fi
      fi
    fi
  done

  # QA sweep: check if any review cards with reviewer pending haven't been triggered yet
  for f in "$BOARD_DIR/review"/*.md; do
    [ -f "$f" ] || continue
    has_reviewer_pending "$f" || continue
    task_id=$(basename "$f" .md)
    # Skip if already triggered this session
    [ -f "$TRIGGER_DIR/$task_id" ] && continue
    echo "[$(date -Iseconds)] TRIGGER: $task_id pending reviewer (sweep)"
    echo "$task_id" > "$TRIGGER_DIR/$task_id"
    if [ -x "$SCRIPTS_DIR/trigger-agent-review.sh" ]; then
      nohup "$SCRIPTS_DIR/trigger-agent-review.sh" "$task_id" >> "$TRIGGER_LOG" 2>&1 &
    fi
  done

  # Detect removed tasks
  for task in "${!TASK_STATUS[@]}"; do
    if [ -z "${CURRENT_STATUS[$task]:-}" ]; then
      echo "[$(date -Iseconds)] $task: removed from board"
    fi
  done

  # Update snapshot
  unset TASK_STATUS
  declare -A TASK_STATUS
  for task in "${!CURRENT_STATUS[@]}"; do
    TASK_STATUS["$task"]="${CURRENT_STATUS[$task]}"
  done
  unset CURRENT_STATUS

done
