#!/usr/bin/env bash
# kb-loop.sh — Continuous agent loop with fresh context per task.
#
# Usage:
#   kb-loop.sh <agent-id>        # loop for the given agent ID
#
# Optional env vars:
#   KB_MAX_FAILURES=3            # consecutive failures before circuit break
#   KB_SLEEP_IDLE=60             # seconds to wait when no tasks found
#   KB_SLEEP_BETWEEN=5           # seconds between tasks
#   KB_MAX_ITERATIONS=0          # max iterations (0 = infinite)

set -euo pipefail

AGENT="${1:?Usage: kb-loop.sh <agent-id>}"
# shellcheck source=lib/config.sh
source "$(dirname "$0")/lib/config.sh"
BOARD_DIR="${KANBAN_ROOT}/board"
SCRIPTS_DIR="${KANBAN_ROOT}/scripts"
LOGFILE="${KANBAN_ROOT}/logs/kb-${AGENT}.log"
LOCK="/tmp/kb-${AGENT}.lock"

MAX_FAILURES="${KB_MAX_FAILURES:-3}"
SLEEP_IDLE="${KB_SLEEP_IDLE:-60}"
SLEEP_BETWEEN="${KB_SLEEP_BETWEEN:-5}"
MAX_ITERATIONS="${KB_MAX_ITERATIONS:-0}"

# Resolve agent role from config
AGENT_ROLE="$(cfg ".agents[] | select(.id == \"${AGENT}\") | .role" "implementer")"
AGENT_EXEC="$(cfg ".agents[] | select(.id == \"${AGENT}\") | .exec_command // \"\"" "")"

# Lock: one instance per agent
exec 200>"$LOCK"
flock -n 200 || { echo "[$(date -Iseconds)] kb($AGENT): already running, exiting" >> "$LOGFILE"; exit 0; }

log() { echo "[$(date -Iseconds)] kb($AGENT): $*" >> "$LOGFILE"; }

consecutive_failures=0
iterations=0

log "started (role=$AGENT_ROLE, max_failures=$MAX_FAILURES, sleep_idle=$SLEEP_IDLE)"

# ──────────────────────────────────────────────────────────────
# Find next task based on role
# ──────────────────────────────────────────────────────────────

find_task() {
    # Implementers and both: claim from in-progress (own) or todo
    if [[ "$AGENT_ROLE" == "implementer" || "$AGENT_ROLE" == "both" ]]; then
        # 1. Own card in in-progress
        for f in "$BOARD_DIR/in-progress"/*.md; do
            [ -f "$f" ] || continue
            if grep -q "assigned_to:.*${AGENT}" "$f"; then
                basename "$f" .md
                return 0
            fi
        done
        # 2. Unassigned card in todo for active sprint
        local current_sprint=""
        if [ -f "${KANBAN_ROOT}/sprints/current.md" ]; then
            current_sprint=$(grep -oP 'sprint-\d+' "${KANBAN_ROOT}/sprints/current.md" | head -1 || true)
        fi
        for f in "$BOARD_DIR/todo"/*.md; do
            [ -f "$f" ] || continue
            if [ -n "$current_sprint" ]; then
                grep -q "sprint: *${current_sprint}" "$f" || continue
            fi
            local _assigned
            _assigned=$(grep '^assigned_to:' "$f" | sed 's/^assigned_to: *//' | tr -d ' "')
            [ -n "$_assigned" ] && [ "$_assigned" != "null" ] && continue
            basename "$f" .md
            return 0
        done
    fi

    # Reviewers and both: claim from review (search all board/review/ dirs)
    # Sort by priority (critical=0, high=1, medium=2, low=3) then by task ID ascending —
    # must match the ordering used by the dashboard API (/api/agents/status).
    if [[ "$AGENT_ROLE" == "reviewer" || "$AGENT_ROLE" == "both" ]]; then
        local next_file
        next_file=$(
            while IFS= read -r f; do
                [ -f "$f" ] || continue
                grep -q "review_requested_from:.*${AGENT}" "$f" || continue
                grep -q 'action: *qa_approved' "$f" && continue
                grep -q 'action: *qa_changes_requested' "$f" && continue
                priority=$(grep "^priority:" "$f" 2>/dev/null | head -1 | awk '{print $2}')
                case "$priority" in
                    critical) rank=0 ;;
                    high)     rank=1 ;;
                    medium)   rank=2 ;;
                    low)      rank=3 ;;
                    *)        rank=2 ;;
                esac
                task_num=$(basename "$f" .md | sed 's/[^0-9]//g')
                printf '%d %06d %s\n' "$rank" "${task_num:-999999}" "$f"
            done < <(find "$KANBAN_ROOT" -path "*/board/review/*.md" 2>/dev/null) \
            | sort -k1,1n -k2,2n | head -1 | awk '{print $3}'
        )
        if [[ -n "$next_file" ]]; then
            echo "$next_file"
            return 0
        fi
    fi

    return 1
}

# ──────────────────────────────────────────────────────────────
# Execute task via exec_command from config
# ──────────────────────────────────────────────────────────────

run_task() {
    local task_id="$1"
    local task_file

    # Accept either a full path or a task ID
    if [ -f "$task_id" ]; then
        task_file="$task_id"
        task_id=$(basename "$task_file" .md)
    else
        task_file=$(find "$KANBAN_ROOT" -name "$task_id.md" -path "*/board/*" | head -1)
    fi
    [ -f "$task_file" ] || return 1

    local title
    title=$(grep '^title:' "$task_file" | sed 's/^title: *"//;s/"$//')

    local project
    project=$(grep '^project:' "$task_file" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')
    local project_dir
    project_dir="$(get_project_path "$project" 2>/dev/null || echo "")"

    if [ -z "$project_dir" ] || [ ! -d "$project_dir" ]; then
        log "ERROR: cannot resolve directory for project '$project' (task $task_id)"
        return 1
    fi

    log "executing $task_id: $title (project: $project, dir: $project_dir)"

    # Reviewer: delegate fully to trigger-agent-review.sh
    if [[ "$AGENT_ROLE" == "reviewer" ]]; then
        "$SCRIPTS_DIR/trigger-agent-review.sh" "$task_id" 2>&1 || return 1
        return 0
    fi

    if [ -z "$AGENT_EXEC" ]; then
        log "ERROR: no exec_command configured for agent '$AGENT'"
        log "HINT: Add exec_command to config.yaml for agent '$AGENT'"
        return 1
    fi

    local prompt
    prompt="$(cat "$task_file")"

    # Substitute placeholders in exec_command
    local cmd="${AGENT_EXEC}"
    cmd="${cmd//\{\{working_dir\}\}/${project_dir}}"
    cmd="${cmd//\{\{kanban_root\}\}/${KANBAN_ROOT}}"

    # Split command string into array and invoke with prompt
    local -a cmd_arr
    read -ra cmd_arr <<< "$cmd"
    "${cmd_arr[@]}" -p "$prompt" 2>&1 || return 1
}

# ──────────────────────────────────────────────────────────────
# Main loop
# ──────────────────────────────────────────────────────────────
while true; do
    # Heartbeat file (monitored by board-monitor and watchdog)
    touch "${KANBAN_ROOT}/agents/${AGENT}.heartbeat" 2>/dev/null || true

    # Sync kanban
    git -C "${KANBAN_ROOT}" pull --rebase --quiet 2>/dev/null || true

    # Find next task (may return full path or task ID)
    task_ref=""
    task_ref=$(find_task 2>/dev/null) || true

    # No task found — idle
    if [ -z "$task_ref" ]; then
        log "idle — no tasks found, sleeping ${SLEEP_IDLE}s"
        sleep "$SLEEP_IDLE"
        continue
    fi

    # Derive display task_id regardless of whether task_ref is a path or ID
    if [ -f "$task_ref" ]; then
        task_id=$(basename "$task_ref" .md)
    else
        task_id="$task_ref"
    fi

    # Heartbeat keeper — updates mtime every 60s during long execution
    HEARTBEAT_PATH="${KANBAN_ROOT}/agents/${AGENT}.heartbeat"
    ( while true; do sleep 60; touch "$HEARTBEAT_PATH" 2>/dev/null || true; done ) &
    HEARTBEAT_PID=$!

    EXIT_CODE=0
    run_task "$task_ref" >> "$LOGFILE" 2>&1 || EXIT_CODE=$?

    kill "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true

    # Circuit breaker
    if [ $EXIT_CODE -ne 0 ]; then
        consecutive_failures=$(( consecutive_failures + 1 ))
        log "FAIL $task_id (exit=$EXIT_CODE, failures=$consecutive_failures/$MAX_FAILURES)"
        if [ "$consecutive_failures" -ge "$MAX_FAILURES" ]; then
            log "CIRCUIT BREAKER: $MAX_FAILURES consecutive failures, stopping"
            exit 1
        fi
        sleep "$SLEEP_IDLE"
    else
        consecutive_failures=0
        log "DONE $task_id"
        sleep "$SLEEP_BETWEEN"
    fi

    iterations=$(( iterations + 1 ))
    if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$iterations" -ge "$MAX_ITERATIONS" ]; then
        log "max iterations ($MAX_ITERATIONS) reached, stopping"
        exit 0
    fi
done
