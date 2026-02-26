#!/usr/bin/env bash
# heartbeat-interactive.sh — Mantém o heartbeat do agente ativo durante sessao interativa.
# Uso: bash scripts/heartbeat-interactive.sh [agent-id]
# Padrao: claude-code

AGENT="${1:-claude-code}"
KANBAN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HEARTBEAT="$KANBAN_ROOT/agents/$AGENT.heartbeat"

mkdir -p "$KANBAN_ROOT/agents"

echo "[heartbeat] Iniciando para agente: $AGENT (Ctrl+C para parar)"

while true; do
  touch "$HEARTBEAT"
  sleep 90
done
