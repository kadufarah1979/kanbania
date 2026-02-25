#!/usr/bin/env bash
# agent-heartbeat.sh — Register an agent's PID for heartbeat checking.
# Usage: agent-heartbeat.sh <agent-name> [pid]
# If pid is omitted, uses $PPID (parent process).
set -euo pipefail

# Load config (auto-detects KANBAN_ROOT for system name)
source "$(dirname "${BASH_SOURCE[0]}")/lib/config.sh"

if [ $# -lt 1 ]; then
  echo "Usage: agent-heartbeat.sh <agent-name> [pid]" >&2
  exit 1
fi

AGENT_NAME="$1"
PID="${2:-$PPID}"

# Use system name from config for the pid file prefix (no hardcoded "kanbania")
SYSTEM_NAME="$(cfg '.system.name' 'kanbania' | tr '[:upper:] ' '[:lower:]-')"

printf '%s\n%s\n' "$PID" "$AGENT_NAME" > "/tmp/${SYSTEM_NAME}-agent-${AGENT_NAME}.pid"
echo "[heartbeat] Registered agent=$AGENT_NAME pid=$PID"
