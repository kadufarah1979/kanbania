#!/usr/bin/env bash
set -euo pipefail

# Register an agent's PID for heartbeat checking.
# Usage: agent-heartbeat.sh <agent-name> [pid]
# If pid is omitted, uses $PPID (parent process).

if [ $# -lt 1 ]; then
  echo "Usage: agent-heartbeat.sh <agent-name> [pid]" >&2
  exit 1
fi

AGENT_NAME="$1"
PID="${2:-$PPID}"

printf '%s\n%s\n' "$PID" "$AGENT_NAME" > "/tmp/kanbania-agent-${AGENT_NAME}.pid"
echo "[heartbeat] Registered agent=$AGENT_NAME pid=$PID"
