#!/usr/bin/env bash
# kb-watchdog.sh — Safety net: reinicia loops mortos, loga warnings de hang.
# Instalar no crontab: */2 * * * * /home/carlosfarah/kanbania/scripts/kb-watchdog.sh

set -euo pipefail

KANBAN_DIR="/home/carlosfarah/kanbania"
LOGFILE="$KANBAN_DIR/logs/kb-watchdog.log"
HEARTBEAT_STALE_SEC=300  # 5 minutos

log() { echo "[$(date -Iseconds)] watchdog: $*" >> "$LOGFILE"; }

for AGENT in claude-code codex; do
  LOCK="/tmp/kb-${AGENT}.lock"
  HEARTBEAT="/tmp/kanbania-agent-${AGENT}.heartbeat"

  # Tenta adquirir lock — se consegue, o loop nao esta rodando
  if flock -n "$LOCK" true 2>/dev/null; then
    log "$AGENT: loop nao esta rodando — reiniciando"
    nohup "$KANBAN_DIR/scripts/kb-loop.sh" "$AGENT" >> "$KANBAN_DIR/logs/kb-${AGENT}.log" 2>&1 &
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
