#!/usr/bin/env bash
# Pre-review environment check — runs BEFORE Codex QA review.
# Detects scope from card content (file paths), runs ONLY relevant gates.
# Outputs compact PASS/FAIL results for the Codex prompt.
#
# Usage: pre-review-check.sh <TASK-ID>
# Exit 0 = all gates passed, Exit 1 = gate failure

set -euo pipefail

TASK_ID="${1:?Usage: pre-review-check.sh <TASK-ID>}"
KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
TASK_FILE="$BOARD_DIR/review/$TASK_ID.md"

if [ ! -f "$TASK_FILE" ]; then
  echo '{"error":"Task not found in review/"}' >&2
  exit 1
fi

# ---- Resolve project directory from card frontmatter ----
CARD_PROJECT=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *"*//;s/"*$//' | head -1)
if [ -z "$CARD_PROJECT" ]; then
  echo '{"error":"No project field in task card"}' >&2
  exit 1
fi

PROJECT_README="$KANBAN_DIR/projects/$CARD_PROJECT/README.md"
if [ ! -f "$PROJECT_README" ]; then
  echo "{\"error\":\"Project README not found: $CARD_PROJECT\"}" >&2
  exit 1
fi

PROJECT_DIR=$(grep '^repo:' "$PROJECT_README" | sed 's/^repo: *"*//;s/"*$//' | head -1)
if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ]; then
  echo "{\"error\":\"Project repo dir not found: $PROJECT_DIR\"}" >&2
  exit 1
fi

LOCK_FILE="/tmp/${CARD_PROJECT}-gate.lock"

# ---- Scope detection from card content (file paths > labels > title) ----
CARD_CONTENT=$(cat "$TASK_FILE")
HAS_BACKEND=false
HAS_FRONTEND=false

# 1st priority: actual file paths in card (grep file directly to avoid echo issues)
if grep -qE 'backend/' "$TASK_FILE"; then
  HAS_BACKEND=true
fi
if grep -qE 'frontend/' "$TASK_FILE"; then
  HAS_FRONTEND=true
fi

# 2nd priority: labels
if ! $HAS_BACKEND && ! $HAS_FRONTEND; then
  if grep -qiE '^labels:.*\b(backend|api|testing)\b' "$TASK_FILE"; then
    HAS_BACKEND=true
  fi
  if grep -qiE '^labels:.*\b(frontend|ux|ui)\b' "$TASK_FILE"; then
    HAS_FRONTEND=true
  fi
fi

# 3rd priority: title keywords
if ! $HAS_BACKEND && ! $HAS_FRONTEND; then
  TITLE=$(grep '^title:' "$TASK_FILE" | head -1)
  if echo "$TITLE" | grep -qiE 'backend|api|endpoint|schema|model|pytest|mqtt|seed'; then
    HAS_BACKEND=true
  fi
  if echo "$TITLE" | grep -qiE 'frontend|dashboard|component|page|sidebar|wizard|chart|tailwind|css'; then
    HAS_FRONTEND=true
  fi
fi

# Fallback: run both
if ! $HAS_BACKEND && ! $HAS_FRONTEND; then
  HAS_BACKEND=true
  HAS_FRONTEND=true
fi

echo "[pre-review] Scope: backend=$HAS_BACKEND frontend=$HAS_FRONTEND" >&2

RESULTS=""
OVERALL_PASS=true

# ---------- Backend gate ----------
if $HAS_BACKEND; then
  echo "[pre-review] Running backend tests..." >&2

  exec 9>"$LOCK_FILE"
  flock -w 300 9 || { echo "[pre-review] Lock timeout" >&2; exit 1; }

  # Reset test DB (if docker-compose with postgres exists)
  if [ -f "$PROJECT_DIR/docker-compose.yml" ] && \
     docker compose -f "$PROJECT_DIR/docker-compose.yml" ps --services 2>/dev/null | grep -q postgres; then
    DB_USER="${CARD_PROJECT}"
    DB_TEST="${CARD_PROJECT}_test"
    docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres \
      psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_TEST};" 2>/dev/null || true
    docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres \
      psql -U "$DB_USER" -c "CREATE DATABASE ${DB_TEST} OWNER ${DB_USER};" 2>/dev/null || true

    for i in $(seq 1 10); do
      docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres \
        pg_isready -U "$DB_USER" 2>/dev/null && break
      sleep 1
    done
  fi

  BACKEND_OUTPUT=""
  BACKEND_EXIT=0
  BACKEND_OUTPUT=$(cd "$PROJECT_DIR" && make test 2>&1) || BACKEND_EXIT=$?
  BACKEND_SUMMARY=$(echo "$BACKEND_OUTPUT" | grep -E '(passed|failed|error)' | tail -1 || echo "no summary")

  if [ $BACKEND_EXIT -eq 0 ]; then
    RESULTS="${RESULTS}BACKEND: PASS — ${BACKEND_SUMMARY}\n"
  else
    RESULTS="${RESULTS}BACKEND: FAIL — ${BACKEND_SUMMARY}\n"
    OVERALL_PASS=false
  fi

  exec 9>&-
else
  RESULTS="${RESULTS}BACKEND: SKIP (no backend changes)\n"
fi

# ---------- Frontend gate (tsc + build, no E2E) ----------
if $HAS_FRONTEND; then
  # Detect frontend dir (frontend/ or dashboard/src for kanbania)
  FRONTEND_DIR=""
  if [ -d "$PROJECT_DIR/frontend" ]; then
    FRONTEND_DIR="$PROJECT_DIR/frontend"
  elif [ -d "$PROJECT_DIR/dashboard" ]; then
    FRONTEND_DIR="$PROJECT_DIR/dashboard"
  fi

  if [ -z "$FRONTEND_DIR" ]; then
    RESULTS="${RESULTS}TSC: SKIP (no frontend dir)\nBUILD: SKIP (no frontend dir)\n"
  else

  echo "[pre-review] Running tsc..." >&2
  TSC_EXIT=0
  TSC_OUTPUT=$(cd "$FRONTEND_DIR" && npx tsc --noEmit 2>&1) || TSC_EXIT=$?

  if [ $TSC_EXIT -eq 0 ]; then
    RESULTS="${RESULTS}TSC: PASS\n"
  else
    TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
    # Only first 10 error lines to limit tokens
    TSC_HEAD=$(echo "$TSC_OUTPUT" | grep "error TS" | head -10)
    RESULTS="${RESULTS}TSC: FAIL — ${TSC_ERRORS} errors\n${TSC_HEAD}\n"
    OVERALL_PASS=false
  fi

  # Clean root-owned .next artifacts (created by Docker builds) to avoid EACCES on unlink
  if [ -d "$FRONTEND_DIR/.next" ] && find "$FRONTEND_DIR/.next" -user root -maxdepth 3 2>/dev/null | grep -q .; then
    echo "[pre-review] Cleaning root-owned .next artifacts via Docker (full wipe)..." >&2
    docker run --rm -v "$FRONTEND_DIR:/app" alpine:latest \
      sh -c "rm -rf /app/.next" 2>/dev/null || true
  fi

  echo "[pre-review] Running build..." >&2
  BUILD_EXIT=0
  BUILD_OUTPUT=$(cd "$FRONTEND_DIR" && npm run build 2>&1) || BUILD_EXIT=$?

  if [ $BUILD_EXIT -eq 0 ]; then
    RESULTS="${RESULTS}BUILD: PASS\n"
  else
    if echo "$BUILD_OUTPUT" | grep -q "EAI_AGAIN\|ENOTFOUND.*fonts"; then
      RESULTS="${RESULTS}BUILD: SKIP (network error)\n"
    else
      BUILD_HEAD=$(echo "$BUILD_OUTPUT" | grep -E "Error:|error" | head -5)
      RESULTS="${RESULTS}BUILD: FAIL\n${BUILD_HEAD}\n"
      OVERALL_PASS=false
    fi
  fi

  fi # end FRONTEND_DIR check
else
  RESULTS="${RESULTS}TSC: SKIP (no frontend changes)\nBUILD: SKIP (no frontend changes)\n"
fi

# ---------- Output (compact) ----------
echo ""
echo "GATES $TASK_ID"
echo -e "$RESULTS"
if $OVERALL_PASS; then
  echo "OVERALL: PASS"
  exit 0
else
  echo "OVERALL: FAIL"
  exit 1
fi
