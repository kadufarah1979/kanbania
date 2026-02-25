#!/usr/bin/env bash
# kb-watchdog.sh — Safety net: restarts dead loops, logs hang warnings.
# Install in crontab: */2 * * * * /path/to/kanbania/scripts/kb-watchdog.sh

set -euo pipefail

source "$(dirname "$0")/lib/config.sh"
LOGFILE="${KANBAN_ROOT}/logs/kb-watchdog.log"
HEARTBEAT_STALE_SEC=300  # 5 minutes

log() { echo "[$(date -Iseconds)] watchdog: $*" >> "$LOGFILE"; }

# Watch all configured agents that have exec_command set
mapfile -t _WATCHDOG_AGENTS < <(get_all_agent_ids 2>/dev/null || echo "")

for AGENT in "${_WATCHDOG_AGENTS[@]}"; do
  [[ -z "$AGENT" ]] && continue
  LOCK="/tmp/kb-${AGENT}.lock"
  HEARTBEAT="/tmp/kanbania-agent-${AGENT}.heartbeat"

  # Tenta adquirir lock — se consegue, o loop nao esta rodando
  if flock -n "$LOCK" true 2>/dev/null; then
    log "$AGENT: loop not running — restarting"
    nohup "${KANBAN_ROOT}/scripts/kb-loop.sh" "$AGENT" >> "${KANBAN_ROOT}/logs/kb-${AGENT}.log" 2>&1 &
    disown
    continue
  fi

  # Lock held — checar heartbeat
  if [ ! -f "$HEARTBEAT" ]; then
    log "$AGENT: lock held mas heartbeat inexistente — possivel hang"
    continue
  fi

  MTIME=$(stat -c %Y "$HEARTBEAT" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  AGE=$(( NOW - MTIME ))

  if [ "$AGE" -gt "$HEARTBEAT_STALE_SEC" ]; then
    log "$AGENT: heartbeat stale (${AGE}s > ${HEARTBEAT_STALE_SEC}s) — possivel hang"
  fi
done
