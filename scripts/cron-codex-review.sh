#!/usr/bin/env bash
# Cron wrapper: dispara codex review a cada 5 min.
# Lock evita execucoes simultaneas. Filtragem de cards esta no trigger.
# Instalar: crontab -e -> */5 * * * * /home/carlosfarah/kanbania/scripts/cron-codex-review.sh
set -euo pipefail

LOCK="/tmp/codex-review-cron.lock"
KANBAN_DIR="/home/carlosfarah/kanbania"
LOGFILE="$KANBAN_DIR/logs/codex-review-trigger.log"

exec 200>"$LOCK"
flock -n 200 || exit 0

cd "$KANBAN_DIR"
git pull --rebase --quiet 2>/dev/null || true

"$KANBAN_DIR/scripts/trigger-codex-review.sh" >> "$LOGFILE" 2>&1
