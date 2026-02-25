#!/usr/bin/env bash
# cron wrapper: triggers agent review every 5 min.
# Lock prevents concurrent runs. Card filtering is in the trigger script.
# Install: crontab -e -> */5 * * * * /path/to/kanbania/scripts/cron-codex-review.sh
set -euo pipefail

LOCK="/tmp/agent-review-cron.lock"
source "$(dirname "$0")/lib/config.sh"
LOGFILE="${KANBAN_ROOT}/logs/agent-review-trigger.log"

exec 200>"$LOCK"
flock -n 200 || exit 0

git -C "${KANBAN_ROOT}" pull --rebase --quiet 2>/dev/null || true

"${KANBAN_ROOT}/scripts/trigger-agent-review.sh" >> "$LOGFILE" 2>&1
