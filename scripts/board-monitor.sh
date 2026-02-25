#!/usr/bin/env bash
# AquaBook Kanban Board Monitor
# Monitors all board columns, sends GNOME notifications on status changes,
# and writes trigger files for tasks entering review.

set -euo pipefail
shopt -s nullglob

BOARD_DIR="/home/carlosfarah/kanbania/board"
SCRIPTS_DIR="/home/carlosfarah/kanbania/scripts"
TRIGGER_DIR="/tmp/aquabook-review-triggers"
COLUMNS=("backlog" "in-progress" "review" "done")
POLL_INTERVAL=10

mkdir -p "$TRIGGER_DIR"

update_status() {
  "$SCRIPTS_DIR/update-agent-status.sh" "$@" 2>/dev/null || true
}

declare -A TASK_STATUS

status_label() {
  case "$1" in
    backlog)     echo "Backlog" ;;
    in-progress) echo "Em Progresso" ;;
    review)      echo "Em Review" ;;
    done)        echo "Concluida" ;;
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

# Initial snapshot (no notifications on startup)
for col in "${COLUMNS[@]}"; do
  while IFS='=' read -r task col_val; do
    TASK_STATUS["$task"]="$col_val"
  done < <(scan_column "$col")
done

echo "[$(date -Iseconds)] Board monitor started. Tracking ${#TASK_STATUS[@]} tasks."
echo "[$(date -Iseconds)] Polling every ${POLL_INTERVAL}s. Trigger dir: $TRIGGER_DIR"

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

      if [ -z "$old_col" ]; then
        summary="AquaBook - Nova Task"
        body="${task}: ${title} | Status: ${new_label} | Responsavel: ${assigned}"
      else
        old_label=$(status_label "$old_col")
        summary="AquaBook - Status Alterado"
        body="${task}: ${title} | ${old_label} -> ${new_label} | Responsavel: ${assigned}"
      fi

      notify-send -u "$urgency" -i "$icon" -a "AquaBook Kanban" "$summary" "$body" 2>/dev/null
      echo "[$(date -Iseconds)] $task: ${old_col:-new} -> $new_col ($title)"

      # Trigger codex QA when task enters review with review_requested_from: [codex]
      if [ "$new_col" = "review" ] && grep -q 'review_requested_from:.*codex' "$file" 2>/dev/null; then
        echo "$task" > "$TRIGGER_DIR/$task"
        echo "[$(date -Iseconds)] TRIGGER: $task entered review, launching codex QA"
        nohup "$SCRIPTS_DIR/trigger-codex-review.sh" "$task" >> /tmp/aquabook-codex-trigger.log 2>&1 &
      fi

      # Update codex status when task moves to in-progress
      if [ "$new_col" = "in-progress" ] && [ "$assigned" = "codex" ]; then
        update_status "codex" "working" "$task" "Trabalhando: $title"
      fi

      # Reset claude-code to idle when review moves to done or in-progress
      if [ "$old_col" = "review" ] && [ "$new_col" != "review" ]; then
        review_count=$(ls "$BOARD_DIR/review"/*.md 2>/dev/null | wc -l || echo 0)
        if [ "$review_count" -eq 0 ]; then
          update_status "claude-code" "idle" "" "Aguardando tarefas em review"
        fi
      fi

      # Trigger CI/CD re-deploy when a cicd-fix task moves to done
      if [ "$new_col" = "done" ] && grep -q 'labels:.*cicd-fix' "$file" 2>/dev/null; then
        echo "[$(date -Iseconds)] TRIGGER: cicd-fix $task approved, triggering pipeline re-deploy"
        nohup "$SCRIPTS_DIR/cicd-trigger-pipeline.sh" "$task" >> /tmp/aquabook-cicd-trigger.log 2>&1 &
      fi

      # Merge codex worktree into main when a task moves to done
      if [ "$new_col" = "done" ]; then
        echo "[$(date -Iseconds)] Merging codex worktree into main..."
        "$SCRIPTS_DIR/sync-codex-worktree.sh" merge >> /tmp/aquabook-codex-trigger.log 2>&1 || true
        # Check no codex task is already in-progress
        codex_in_progress=false
        for ip_file in "$BOARD_DIR/in-progress"/*.md; do
          ip_assigned=$(get_task_assigned "$ip_file")
          if [ "$ip_assigned" = "codex" ]; then
            codex_in_progress=true
            break
          fi
        done
        if ! $codex_in_progress; then
          echo "[$(date -Iseconds)] TRIGGER: task done, launching Codex for next task"
          nohup "$SCRIPTS_DIR/trigger-codex-next.sh" >> /tmp/aquabook-codex-trigger.log 2>&1 &
        fi
      fi

      # Trigger Codex fix when task moves back to in-progress with changes_requested
      if [ "$new_col" = "in-progress" ] && [ "$assigned" = "codex" ]; then
        last_action=$(grep 'action:' "$file" | head -1 | sed 's/.*action: *//')
        if [ "$last_action" = "changes_requested" ]; then
          echo "[$(date -Iseconds)] TRIGGER: changes requested, launching Codex fix for $task"
          nohup "$SCRIPTS_DIR/trigger-codex-fix.sh" "$task" >> /tmp/aquabook-codex-trigger.log 2>&1 &
        fi
      fi
    fi
  done

  # QA sweep: check if any review cards with codex pending haven't been triggered yet
  for f in "$BOARD_DIR/review"/*.md; do
    [ -f "$f" ] || continue
    grep -q 'review_requested_from:.*codex' "$f" || continue
    task_id=$(basename "$f" .md)
    # Skip if already triggered this session
    [ -f "$TRIGGER_DIR/$task_id" ] && continue
    echo "[$(date -Iseconds)] TRIGGER: $task_id pending codex review (sweep)"
    echo "$task_id" > "$TRIGGER_DIR/$task_id"
    nohup "$SCRIPTS_DIR/trigger-codex-review.sh" "$task_id" >> /tmp/aquabook-codex-trigger.log 2>&1 &
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
