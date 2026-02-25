#!/usr/bin/env bash
# cicd-trigger-pipeline.sh — Trigger a GitLab pipeline for re-deploy after cicd-fix approval
#
# Usage: cicd-trigger-pipeline.sh <task_id>
# Env:   GITLAB_TOKEN, GITLAB_PROJECT_ID, GITLAB_API_URL

set -euo pipefail

TASK_ID="${1:?Usage: cicd-trigger-pipeline.sh <task_id>}"

: "${GITLAB_TOKEN:?GITLAB_TOKEN not set}"
: "${GITLAB_PROJECT_ID:?GITLAB_PROJECT_ID not set}"
GITLAB_API_URL="${GITLAB_API_URL:-http://git.lab.tectoylabs.com.br/api/v4}"

KANBAN_DIR="/home/carlosfarah/kanbania"
LOGS_DIR="$KANBAN_DIR/logs"

now() { date -Iseconds | sed 's/+00:00$/-03:00/'; }

# ── Trigger pipeline on main ────────────────────────────────────────────────

response=$(curl -sf \
  --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"ref":"main"}' \
  "$GITLAB_API_URL/projects/$GITLAB_PROJECT_ID/pipeline" || echo "")

if [ -z "$response" ]; then
  echo "ERROR: Failed to trigger pipeline" >&2
  exit 1
fi

pipeline_id=$(echo "$response" | jq -r '.id // "unknown"')
pipeline_url=$(echo "$response" | jq -r '.web_url // "unknown"')

echo "[cicd-trigger] Pipeline #$pipeline_id triggered for $TASK_ID: $pipeline_url"

# ── Log to activity.jsonl ───────────────────────────────────────────────────

timestamp=$(now)
activity_file="$LOGS_DIR/activity.jsonl"

# Read project from the task file
task_project="unknown"
for col in in-progress review done; do
  task_file="$KANBAN_DIR/board/$col/$TASK_ID.md"
  if [ -f "$task_file" ]; then
    task_project=$(grep '^project:' "$task_file" | sed 's/^project: *//' | tr -d '"' || echo "unknown")
    break
  fi
done

log_entry=$(cat <<EOF
{"timestamp":"$timestamp","agent":"board-monitor","action":"cicd_pipeline_triggered","entity_type":"task","entity_id":"$TASK_ID","project":"$task_project","details":"Re-deploy pipeline #$pipeline_id disparado ($pipeline_url)"}
EOF
)
echo "$log_entry" >> "$activity_file"

cd "$KANBAN_DIR"
git add "$activity_file"
git commit -m "[KANBAN] cicd-trigger $TASK_ID: re-deploy pipeline #$pipeline_id

Agent: board-monitor"
git push origin main
