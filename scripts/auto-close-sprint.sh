#!/usr/bin/env bash
# Auto-close sprint — called by chokidar watcher when all tasks are in done.
# Archives done cards, closes sprint, activates next, commits and pushes.
#
# Usage: auto-close-sprint.sh <sprint-id> <project-slug>

set -euo pipefail

SPRINT_ID="${1:?Usage: auto-close-sprint.sh <sprint-id> <project-slug>}"
PROJECT="${2:?Missing project slug}"
source "$(dirname "$0")/lib/config.sh"
KANBAN_DIR="${KANBAN_ROOT}"
BOARD_DIR="${KANBAN_ROOT}/board"
ARCHIVE_DIR="${KANBAN_ROOT}/archive/board/done"
SPRINTS_DIR="${KANBAN_ROOT}/sprints"
ARCHIVE_SPRINTS="${KANBAN_ROOT}/archive/sprints"
LOG_FILE="${KANBAN_ROOT}/logs/activity.jsonl"
LOCK_FILE="/tmp/auto-close-sprint.lock"

now() { date -Iseconds | sed 's/+00:00$/-03:00/'; }

log_info() { echo "[auto-close] $*"; }

# Prevent concurrent runs
exec 9>"$LOCK_FILE"
flock -n 9 || { log_info "Already running, skipping"; exit 0; }

# Double-check: all sprint tasks must be in done
for col in backlog todo in-progress review; do
  dir="$BOARD_DIR/$col"
  [ -d "$dir" ] || continue
  for f in "$dir"/*.md; do
    [ -f "$f" ] || continue
    if grep -q "sprint: $SPRINT_ID" "$f" 2>/dev/null || grep -q "sprint: \"$SPRINT_ID\"" "$f" 2>/dev/null; then
      log_info "Task $(basename "$f" .md) still in $col — aborting"
      exit 0
    fi
  done
done

log_info "All tasks for $SPRINT_ID in done — proceeding with auto-close"

# 1. Archive done cards for this sprint
mkdir -p "$ARCHIVE_DIR"
ARCHIVED=0
for f in "$BOARD_DIR/done"/*.md; do
  [ -f "$f" ] || continue
  if grep -q "sprint: $SPRINT_ID" "$f" 2>/dev/null || grep -q "sprint: \"$SPRINT_ID\"" "$f" 2>/dev/null; then
    mv "$f" "$ARCHIVE_DIR/"
    ARCHIVED=$((ARCHIVED + 1))
    log_info "Archived $(basename "$f")"
  fi
done

# 2. Close sprint
SPRINT_FILE="$SPRINTS_DIR/$SPRINT_ID.md"
if [ -f "$SPRINT_FILE" ]; then
  sed -i 's/^status:.*/status: completed/' "$SPRINT_FILE"
  mkdir -p "$ARCHIVE_SPRINTS"
  mv "$SPRINT_FILE" "$ARCHIVE_SPRINTS/"
  log_info "Closed and archived $SPRINT_ID"
fi

# 3. Find and activate next sprint for this project
NEXT_SPRINT=""
for f in "$SPRINTS_DIR"/sprint-*.md; do
  [ -f "$f" ] || continue
  if grep -q "project: $PROJECT" "$f" 2>/dev/null && grep -q "status: planning" "$f" 2>/dev/null; then
    sid=$(basename "$f" .md)
    if [ -z "$NEXT_SPRINT" ] || [[ "$sid" < "$NEXT_SPRINT" ]]; then
      NEXT_SPRINT="$sid"
    fi
  fi
done

if [ -n "$NEXT_SPRINT" ]; then
  sed -i "s/^status:.*/status: active/" "$SPRINTS_DIR/$NEXT_SPRINT.md"
  # Update current.md
  CURRENT_FILE="$SPRINTS_DIR/current.md"
  if [ -f "$CURRENT_FILE" ]; then
    sed -i "s/\*\*Sprint ativa\*\*:.*/\*\*Sprint ativa\*\*: $NEXT_SPRINT/" "$CURRENT_FILE"
  fi
  log_info "Activated next sprint: $NEXT_SPRINT"
fi

# 4. Log activity
TS=$(now)
echo "{\"timestamp\":\"$TS\",\"agent\":\"chokidar\",\"task_id\":\"\",\"action\":\"sprint_closed\",\"details\":\"Auto-closed $SPRINT_ID, archived $ARCHIVED cards\"}" >> "$LOG_FILE"

# 5. Commit and push
cd "${KANBAN_ROOT}"
git add -A
git commit -m "[KANBAN] auto-close $SPRINT_ID: $ARCHIVED cards archived

Sprint completada automaticamente via chokidar watcher.
$([ -n "$NEXT_SPRINT" ] && echo "Proxima sprint: $NEXT_SPRINT")

Agent: chokidar
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" || true

git push || log_info "Push failed — will retry on next commit"

# 6. Rebuild Docker if docker-compose exists
if [ -f "${KANBAN_ROOT}/dashboard/docker-compose.yml" ] || [ -f "${KANBAN_ROOT}/docker-compose.yml" ]; then
  COMPOSE_FILE="${KANBAN_ROOT}/dashboard/docker-compose.yml"
  [ -f "$COMPOSE_FILE" ] || COMPOSE_FILE="${KANBAN_ROOT}/docker-compose.yml"
  log_info "Rebuilding Docker containers..."
  docker compose -f "$COMPOSE_FILE" up -d --build 2>&1 || log_info "Docker rebuild failed"
fi

log_info "Done — $SPRINT_ID closed, $ARCHIVED cards archived"

exec 9>&-
