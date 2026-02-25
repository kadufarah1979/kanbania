#!/usr/bin/env bash
# cicd-analyze-error.sh — Fetch GitLab job logs and classify the error
#
# Usage: cicd-analyze-error.sh <job_id>
# Env:   GITLAB_TOKEN, GITLAB_PROJECT_ID, GITLAB_API_URL
# Output: JSON on stdout: {"category":"...","summary":"...","job_name":"..."}

set -euo pipefail

JOB_ID="${1:?Usage: cicd-analyze-error.sh <job_id>}"

: "${GITLAB_TOKEN:?GITLAB_TOKEN not set}"
: "${GITLAB_PROJECT_ID:?GITLAB_PROJECT_ID not set}"
GITLAB_API_URL="${GITLAB_API_URL:-http://git.lab.tectoylabs.com.br/api/v4}"

# ── Fetch job metadata ──────────────────────────────────────────────────────

job_json=$(curl -sf \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_API_URL/projects/$GITLAB_PROJECT_ID/jobs/$JOB_ID")

job_name=$(echo "$job_json" | jq -r '.name // "unknown"')

# ── Fetch job trace (log) ───────────────────────────────────────────────────

trace=$(curl -sf \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "$GITLAB_API_URL/projects/$GITLAB_PROJECT_ID/jobs/$JOB_ID/trace" || echo "")

if [ -z "$trace" ]; then
  echo "{\"category\":\"unknown_error\",\"summary\":\"Failed to fetch job trace\",\"job_name\":\"$job_name\"}"
  exit 0
fi

# ── Classify error by pattern matching ──────────────────────────────────────

category="unknown_error"

if echo "$trace" | grep -qiE 'docker build.*error|npm run build.*error|tsc.*error|build.*failed|compilation.*error'; then
  category="build_error"
elif echo "$trace" | grep -qiE 'alembic.*error|migration.*fail|migrate.*error|database.*migration'; then
  category="migration_error"
elif echo "$trace" | grep -qiE 'health check.*fail|rollback|deploy.*fail|deployment.*error'; then
  category="deploy_failure"
elif echo "$trace" | grep -qiE 'pytest.*FAILED|test.*fail|jest.*fail|FAIL.*test'; then
  category="test_failure"
fi

# ── Extract ~50 lines around first error ────────────────────────────────────

error_context=""
error_line=$(echo "$trace" | grep -niE 'error|fail|FAILED|exception' | head -1 | cut -d: -f1)

if [ -n "$error_line" ]; then
  total_lines=$(echo "$trace" | wc -l)
  start=$((error_line - 25))
  [ "$start" -lt 1 ] && start=1
  end=$((error_line + 25))
  [ "$end" -gt "$total_lines" ] && end="$total_lines"
  error_context=$(echo "$trace" | sed -n "${start},${end}p")
else
  # Fallback: last 50 lines
  error_context=$(echo "$trace" | tail -50)
fi

# ── Helpers ─────────────────────────────────────────────────────────────────

strip_ansi() {
  sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | tr -d '\000-\010\016-\037'
}

json_escape() {
  local s
  s=$(echo "$1" | strip_ansi)
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/}"
  s="${s//$'\t'/\\t}"
  echo "$s"
}

# ── Build summary (first meaningful error line + context) ───────────────────

first_error=$(echo "$trace" | strip_ansi | grep -iE 'error|fail|FAILED|exception' | head -1 | sed 's/^[[:space:]]*//' | cut -c1-200)
[ -z "$first_error" ] && first_error="Pipeline job failed (no clear error line detected)"

summary_escaped=$(json_escape "$first_error")
context_escaped=$(json_escape "$error_context")

cat <<EOF
{"category":"$category","summary":"$summary_escaped","job_name":"$job_name","error_context":"$context_escaped"}
EOF
