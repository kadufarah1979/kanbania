#!/usr/bin/env bash
# Updates an agent's live status file.
# Usage: update-agent-status.sh <agent> <status> [task_id] [description]
# Status: idle | working | reviewing | waiting | offline

set -euo pipefail

AGENT="${1:?Usage: update-agent-status.sh <agent> <status> [task_id] [description]}"
STATUS="${2:?Status required: idle|working|reviewing|waiting|offline}"
TASK_ID="${3:-null}"
DESCRIPTION="${4:-}"
TIMESTAMP=$(date -Iseconds)

STATUS_FILE="/home/carlosfarah/kanbania/agents/${AGENT}.status.json"

if [ "$TASK_ID" = "null" ] || [ -z "$TASK_ID" ]; then
  TASK_JSON="null"
else
  TASK_JSON="\"${TASK_ID}\""
fi

cat > "$STATUS_FILE" << ENDJSON
{
  "agent": "${AGENT}",
  "status": "${STATUS}",
  "task_id": ${TASK_JSON},
  "description": "${DESCRIPTION}",
  "updated_at": "${TIMESTAMP}"
}
ENDJSON
