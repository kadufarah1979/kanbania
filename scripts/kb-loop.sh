#!/usr/bin/env bash
# kb-loop.sh — Loop continuo de agente com contexto fresh por task.
#
# Usage:
#   kb-loop.sh claude-code    # loop do claude-code (implementacao)
#   kb-loop.sh codex          # loop do codex (QA review)
#
# Env vars opcionais:
#   KB_MAX_FAILURES=3         # circuit breaker: falhas consecutivas antes de parar
#   KB_SLEEP_IDLE=60          # segundos de espera quando nao ha tasks (default: 60)
#   KB_SLEEP_BETWEEN=5        # segundos entre tasks (default: 5)
#   KB_MAX_ITERATIONS=0       # max iteracoes (0=infinito)

set -euo pipefail

AGENT="${1:?Usage: kb-loop.sh <claude-code|codex>}"
KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
SCRIPTS_DIR="$KANBAN_DIR/scripts"
source "$SCRIPTS_DIR/lib-kanban.sh"
LOGFILE="$KANBAN_DIR/logs/kb-${AGENT}.log"
LOCK="/tmp/kb-${AGENT}.lock"

MAX_FAILURES="${KB_MAX_FAILURES:-3}"
SLEEP_IDLE="${KB_SLEEP_IDLE:-60}"
SLEEP_BETWEEN="${KB_SLEEP_BETWEEN:-5}"
MAX_ITERATIONS="${KB_MAX_ITERATIONS:-0}"

# Lock: apenas 1 instancia por agente
exec 200>"$LOCK"
flock -n 200 || { echo "[$(date -Iseconds)] kb($AGENT): already running, exiting" >> "$LOGFILE"; exit 0; }

log() { echo "[$(date -Iseconds)] kb($AGENT): $*" >> "$LOGFILE"; }

consecutive_failures=0
iterations=0

log "started (max_failures=$MAX_FAILURES, sleep_idle=$SLEEP_IDLE, max_iterations=$MAX_ITERATIONS)"

# ──────────────────────────────────────────────────────────────
# Find next task
# ──────────────────────────────────────────────────────────────
find_claude_task() {
  # 1. Card em in-progress atribuido a claude-code
  for f in "$BOARD_DIR/in-progress"/*.md; do
    [ -f "$f" ] || continue
    if grep -q 'assigned_to:.*claude-code' "$f"; then
      basename "$f" .md
      return 0
    fi
  done
  # 2. Card em todo do sprint ativo
  local current_sprint=""
  if [ -f "$KANBAN_DIR/sprints/current.md" ]; then
    current_sprint=$(grep -oP 'sprint-\d+' "$KANBAN_DIR/sprints/current.md" | head -1 || true)
  fi
  for f in "$BOARD_DIR/todo"/*.md; do
    [ -f "$f" ] || continue
    if [ -n "$current_sprint" ]; then
      grep -q "sprint: *$current_sprint" "$f" || continue
    fi
    # Pular se ja tem assigned_to (ignorar null e vazio)
    local _assigned
    _assigned=$(grep '^assigned_to:' "$f" | sed 's/^assigned_to: *//' | tr -d ' "')
    [ -n "$_assigned" ] && [ "$_assigned" != "null" ] && continue
    basename "$f" .md
    return 0
  done
  return 1
}

find_codex_task() {
  for f in "$BOARD_DIR/review"/*.md; do
    [ -f "$f" ] || continue
    grep -q 'review_requested_from:.*codex' "$f" || continue
    grep -q 'action: *qa_approved' "$f" && continue
    grep -q 'action: *qa_changes_requested' "$f" && continue
    basename "$f" .md
    return 0
  done
  return 1
}

# ──────────────────────────────────────────────────────────────
# Execute task
# ──────────────────────────────────────────────────────────────
run_claude_task() {
  local task_id="$1"
  local task_file
  task_file=$(find "$BOARD_DIR" -name "$task_id.md" | head -1)
  [ -f "$task_file" ] || return 1

  local title
  title=$(grep '^title:' "$task_file" | sed 's/^title: *"//;s/"$//')

  # Resolve project repo dynamically
  local project
  project=$(grep '^project:' "$task_file" | sed 's/^project: *//' | tr -d '"' | tr -d ' ')
  local project_repo
  project_repo=$(get_project_repo "$project")

  if [ -z "$project_repo" ] || [ ! -d "$project_repo" ]; then
    log "ERROR: cannot resolve repo for project '$project' (task $task_id)"
    return 1
  fi

  log "executing $task_id: $title (project: $project, repo: $project_repo)"

  # Detect rework vs new implementation
  local is_rework=false
  if grep -q 'codex (QA)' "$task_file"; then
    is_rework=true
  fi

  local system_prompt card_content
  if $is_rework; then
    system_prompt=$(sed "s/{TASK_ID}/$task_id/g" "$SCRIPTS_DIR/prompts/claude-code-rework.md")
    card_content=$("$SCRIPTS_DIR/card-slice.sh" "$task_id" rework)
  else
    system_prompt=$(sed "s/{TASK_ID}/$task_id/g" "$SCRIPTS_DIR/prompts/claude-code-impl.md")
    card_content=$("$SCRIPTS_DIR/card-slice.sh" "$task_id" full)
  fi

  (cd "$project_repo" && \
    unset CLAUDECODE && \
    claude \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
    --system-prompt "$system_prompt" \
    -p "TASK: $task_id
CARD:
$card_content") 2>&1 || return 1
}

run_codex_task() {
  local task_id="$1"
  log "executing QA $task_id"

  # Usa o trigger existente que ja prepara gates + diff
  "$SCRIPTS_DIR/trigger-codex-review.sh" "$task_id" 2>&1 || return 1
}

# ──────────────────────────────────────────────────────────────
# Main loop
# ──────────────────────────────────────────────────────────────
while true; do
  # Heartbeat — antes do git pull; usa KANBAN_DIR (nao /tmp) para acesso pelo Next.js
  touch "$KANBAN_DIR/agents/${AGENT}.heartbeat"

  # Sync kanban
  cd "$KANBAN_DIR"
  git pull --rebase --quiet 2>/dev/null || true

  # Find next task
  task_id=""
  if [ "$AGENT" = "claude-code" ]; then
    task_id=$(find_claude_task 2>/dev/null) || true
  elif [ "$AGENT" = "codex" ]; then
    task_id=$(find_codex_task 2>/dev/null) || true
  else
    log "ERROR: unknown agent '$AGENT'"
    exit 1
  fi

  # No task found — idle
  if [ -z "$task_id" ]; then
    log "idle — no tasks found, sleeping ${SLEEP_IDLE}s"
    sleep "$SLEEP_IDLE"
    continue
  fi

  # Heartbeat keeper — atualiza mtime a cada 60s durante execucao longa
  HEARTBEAT_PATH="$KANBAN_DIR/agents/${AGENT}.heartbeat"
  ( while true; do sleep 60; touch "$HEARTBEAT_PATH" 2>/dev/null || true; done ) &
  HEARTBEAT_PID=$!

  # Execute task (fresh context — cada chamada e uma sessao nova)
  EXIT_CODE=0
  if [ "$AGENT" = "claude-code" ]; then
    run_claude_task "$task_id" >> "$LOGFILE" 2>&1 || EXIT_CODE=$?
  else
    run_codex_task "$task_id" >> "$LOGFILE" 2>&1 || EXIT_CODE=$?
  fi

  # Para o heartbeat keeper
  kill "$HEARTBEAT_PID" 2>/dev/null || true
  wait "$HEARTBEAT_PID" 2>/dev/null || true

  # Circuit breaker
  if [ $EXIT_CODE -ne 0 ]; then
    consecutive_failures=$((consecutive_failures + 1))
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

  # Max iterations check
  iterations=$((iterations + 1))
  if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$iterations" -ge "$MAX_ITERATIONS" ]; then
    log "max iterations ($MAX_ITERATIONS) reached, stopping"
    exit 0
  fi
done
