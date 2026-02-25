#!/usr/bin/env bash
# kb — CLI wrapper for kanban automation
# Reduces per-task transitions from ~15 manual operations to 1 command.
#
# Usage: kb [--dry-run] [--no-commit] [--no-push] [--confirm] <command> [args...]
# Commands: claim, review, approve, resubmit, status, batch-review, complete-sprint, help

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

BOARD_DIR="$KANBAN_ROOT/board"   # Global board (default/fallback)
LOGS_DIR="$KANBAN_ROOT/logs"
LOCK_DIR="/tmp/kb-locks"
GLOBAL_LOCK_FILE="$LOCK_DIR/board-global.lock"

# Load columns from config once at startup
mapfile -t _ALL_COLUMNS < <(get_columns)

# Build reviewer list for YAML frontmatter: [agent1, agent2]
_REVIEWERS_YAML="[$(get_reviewers | paste -sd ',' | sed 's/,/, /g')]"

# ── Flags ────────────────────────────────────────────────────────────────────

DRY_RUN=false
NO_COMMIT=false
NO_PUSH=false
CONFIRM=false

# ── Utilities ────────────────────────────────────────────────────────────────

now() { date -Iseconds; }

log_info()  { echo "[kb] $*"; }
log_error() { echo "[kb] ERROR: $*" >&2; }
log_warn()  { echo "[kb] WARN: $*" >&2; }
die()       { log_error "$@"; exit 1; }

run() {
  if $DRY_RUN; then
    log_info "[dry-run] $*"
  else
    "$@"
  fi
}

# ── Guards ───────────────────────────────────────────────────────────────────

# find_task_file <task-id>
# Searches all board dirs (global + projects + subprojects) for the task file.
# Prints the full path and returns 0 if found, returns 1 if not found.
find_task_file() {
  local task_id="$1"
  local board_dir col
  while IFS= read -r board_dir; do
    for col in "${_ALL_COLUMNS[@]}"; do
      if [ -f "$board_dir/$col/$task_id.md" ]; then
        echo "$board_dir/$col/$task_id.md"
        return 0
      fi
    done
  done < <(get_board_dirs)
  return 1
}

find_task_column() {
  local task_id="$1"
  local task_file
  if task_file=$(find_task_file "$task_id"); then
    basename "$(dirname "$task_file")"
    return 0
  fi
  return 1
}

require_task_in() {
  local task_id="$1"
  local expected_col="$2"

  local task_file
  if task_file=$(find_task_file "$task_id"); then
    local actual_col
    actual_col=$(basename "$(dirname "$task_file")")
    if [ "$actual_col" = "$expected_col" ]; then
      return 0
    fi
    append_conflict "$task_id" "state-mismatch: expected=$expected_col actual=$actual_col"
    die "$task_id is in '$actual_col', expected '$expected_col'"
  else
    append_conflict "$task_id" "state-mismatch: expected=$expected_col actual=missing"
    die "$task_id not found in any column"
  fi
}

require_clean_git() {
  if $NO_COMMIT || $DRY_RUN; then
    return 0
  fi
  local status
  status=$(git -C "$KANBAN_ROOT" status --porcelain)
  if [ -n "$status" ]; then
    die "Kanban repo has uncommitted changes. Commit or stash first.\n$status"
  fi
}

require_sync_ready() {
  if $DRY_RUN; then
    return 0
  fi
  [ -x "$SCRIPTS_DIR/kanban-sync-check.sh" ] || die "Missing sync checker: $SCRIPTS_DIR/kanban-sync-check.sh"
  "$SCRIPTS_DIR/kanban-sync-check.sh" --repo "$KANBAN_ROOT"
}

# ── Locking ──────────────────────────────────────────────────────────────────

LOCK_FD=""
LOCK_FILE=""

acquire_lock() {
  local task_id="${1:-board}"
  mkdir -p "$LOCK_DIR"
  LOCK_FILE="$GLOBAL_LOCK_FILE"
  exec 200>"$LOCK_FILE"
  if ! flock -w 30 200; then
    append_conflict "$task_id" "lock-timeout: global board lock busy"
    die "Could not acquire global board lock (timeout 30s)"
  fi
  LOCK_FD=200
}

release_lock() {
  if [ -n "$LOCK_FD" ]; then
    exec 200>&- 2>/dev/null || true
    LOCK_FD=""
  fi
}

# ── Frontmatter (sed-based) ─────────────────────────────────────────────────

fm_set() {
  local file="$1" field="$2" value="$3"
  if $DRY_RUN; then
    log_info "[dry-run] fm_set $field: $value in $file"
    return 0
  fi
  # Only replace within YAML frontmatter (between first two --- delimiters)
  awk -v f="$field" -v v="$value" '
    BEGIN { fm=0; count=0 }
    /^---$/ { count++; fm=(count==1)?1:0 }
    fm && $0 ~ "^"f":" { print f": "v; next }
    { print }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}

fm_get_version() {
  local file="$1"
  local v
  v=$(grep -E '^version:' "$file" | head -1 | sed 's/^version:[[:space:]]*//' | tr -d '"' || true)
  if [ -z "$v" ]; then
    echo "1"
    return 0
  fi
  if ! [[ "$v" =~ ^[0-9]+$ ]]; then
    die "Invalid version in $file: '$v'"
  fi
  echo "$v"
}

fm_set_or_add_version() {
  local file="$1" value="$2"
  if grep -qE '^version:' "$file"; then
    sed -i "s/^version:.*/version: $value/" "$file"
    return 0
  fi
  # Inject version close to id for stable frontmatter shape.
  awk -v value="$value" '
    /^id:/ && !inserted {
      print $0
      print "version: " value
      inserted=1
      next
    }
    { print }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}

require_version_unchanged() {
  local file="$1" expected="$2"
  local current
  current=$(fm_get_version "$file")
  if [ "$current" != "$expected" ]; then
    local task_id
    task_id=$(basename "$file" .md)
    append_conflict "$task_id" "version-conflict: expected=$expected current=$current"
    die "Version conflict in $(basename "$file"): expected=$expected current=$current"
  fi
}

fm_bump_version() {
  local file="$1"
  local current next
  current=$(fm_get_version "$file")
  next=$((current + 1))
  fm_set_or_add_version "$file" "$next"
}

fm_append_acted() {
  local file="$1" agent="$2" action="$3"
  local ts
  ts=$(now)
  if $DRY_RUN; then
    log_info "[dry-run] fm_append_acted $agent/$action in $file"
    return 0
  fi
  # Insert 3 lines before the closing --- of frontmatter
  awk -v agent="$agent" -v action="$action" -v ts="$ts" '
    BEGIN { count=0 }
    /^---$/ { count++ }
    count==2 && /^---$/ {
      printf "  - agent: %s\n    action: %s\n    date: \"%s\"\n", agent, action, ts
    }
    { print }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}

# ── Activity log ─────────────────────────────────────────────────────────────

append_activity() {
  local task_id="$1" action="$2" details="${3:-}"
  local ts
  ts=$(now)
  if $DRY_RUN; then
    log_info "[dry-run] append_activity $task_id $action"
    return 0
  fi
  local title card_file
  card_file=$(find_task_file "$task_id" 2>/dev/null || true)
  local project="unknown"
  if [ -n "${card_file:-}" ]; then
    title=$(grep '^title:' "$card_file" | sed 's/^title: *"//;s/"$//' | head -1)
    project=$(grep '^project:' "$card_file" | sed 's/^project: *//' | head -1)
  else
    title="$task_id"
  fi

  if [ -z "$details" ]; then
    details="$action: $title"
  fi

  mkdir -p "$LOGS_DIR"
  jq -cn \
    --arg ts "$ts" \
    --arg agent "$KB_AGENT" \
    --arg action "$action" \
    --arg entity_id "$task_id" \
    --arg details "$details" \
    --arg project "$project" \
    '{timestamp:$ts, agent:$agent, action:$action, entity_type:"task", entity_id:$entity_id, details:$details, project:$project}' \
    >> "$LOGS_DIR/activity.jsonl"
}

append_conflict() {
  local task_id="$1"
  local details="$2"
  local ts
  ts=$(now)
  if $DRY_RUN; then
    log_info "[dry-run] append_conflict $task_id $details"
    return 0
  fi
  local project="unknown" card_file
  card_file=$(find_task_file "$task_id" 2>/dev/null || true)
  if [ -n "${card_file:-}" ]; then
    project=$(grep '^project:' "$card_file" | sed 's/^project: *//' | head -1)
  fi
  mkdir -p "$LOGS_DIR"
  jq -cn \
    --arg ts "$ts" \
    --arg agent "$KB_AGENT" \
    --arg entity_id "$task_id" \
    --arg details "$details" \
    --arg project "$project" \
    '{timestamp:$ts, agent:$agent, action:"update", entity_type:"task", entity_id:$entity_id, details:$details, project:$project}' \
    >> "$LOGS_DIR/activity.jsonl"
}

# ── Git ──────────────────────────────────────────────────────────────────────

kb_push_with_retry() {
  local attempts=3
  local i
  for i in $(seq 1 $attempts); do
    if git -C "$KANBAN_ROOT" push 2>/dev/null; then
      return 0
    fi
    log_info "[push] Attempt $i failed (non-fast-forward). Rebasing..."
    git -C "$KANBAN_ROOT" pull --rebase origin main
  done
  log_info "[push] All $attempts attempts failed. Registering in activity.jsonl."
  return 1
}

kb_commit() {
  local msg="$1"
  if $NO_COMMIT || $DRY_RUN; then
    if $DRY_RUN; then
      log_info "[dry-run] git commit: $msg"
    else
      log_info "[no-commit] Skipping git commit: $msg"
    fi
    return 0
  fi
  git -C "$KANBAN_ROOT" add -A
  git -C "$KANBAN_ROOT" commit -m "$msg"
  if ! $NO_PUSH; then
    kb_push_with_retry
  else
    log_info "[no-push] Skipping git push after commit: $msg"
  fi
}

ensure_task_unique() {
  local task_id="$1"
  local hits=0 board_dir col
  while IFS= read -r board_dir; do
    for col in "${_ALL_COLUMNS[@]}"; do
      if [ -f "$board_dir/$col/$task_id.md" ]; then
        hits=$((hits + 1))
      fi
    done
  done < <(get_board_dirs)
  if [ "$hits" -ne 1 ]; then
    append_conflict "$task_id" "postcondition-failed: expected unique card copy, found=$hits"
    die "Postcondition failed for $task_id: expected exactly 1 copy, found $hits"
  fi
}

assert_post_move() {
  local task_id="$1" src_col="$2" dst_col="$3" board_dir="$4"
  if [ -f "$board_dir/$src_col/$task_id.md" ] || [ ! -f "$board_dir/$dst_col/$task_id.md" ]; then
    append_conflict "$task_id" "postcondition-failed: move $src_col->$dst_col not materialized"
    die "Postcondition failed for $task_id: move $src_col -> $dst_col not materialized"
  fi
  ensure_task_unique "$task_id"
}

move_task_file() {
  local task_id="$1" src_col="$2" dst_col="$3" board_dir="$4"
  local src="$board_dir/$src_col/$task_id.md"
  local dst="$board_dir/$dst_col/$task_id.md"
  run mv "$src" "$dst"
  if ! $DRY_RUN; then
    assert_post_move "$task_id" "$src_col" "$dst_col" "$board_dir"
  fi
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_claim() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Find task across all boards
  local task_file src_col board_dir
  if ! task_file=$(find_task_file "$task_id"); then
    die "$task_id not found in any board"
  fi
  src_col=$(basename "$(dirname "$task_file")")
  board_dir=$(dirname "$(dirname "$task_file")")

  # Idempotency: already in in-progress with correct assignment
  if [ "$src_col" = "in-progress" ]; then
    if grep -q "^assigned_to: $KB_AGENT" "$task_file"; then
      log_info "$task_id already in in-progress (assigned to $KB_AGENT)"
      exit 0
    fi
  fi

  # Accept tasks from both backlog and todo
  if [ "$src_col" != "todo" ] && [ "$src_col" != "backlog" ]; then
    die "$task_id is in '$src_col', not todo/ or backlog/"
  fi
  require_clean_git

  local dst="$board_dir/in-progress/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$task_file")

  move_task_file "$task_id" "$src_col" "in-progress" "$board_dir"

  if ! $DRY_RUN; then
    require_version_unchanged "$dst" "$expected_version"
    fm_set "$dst" "assigned_to" "$KB_AGENT"
    fm_append_acted "$dst" "$KB_AGENT" "claimed"
    fm_bump_version "$dst"
  fi

  append_activity "$task_id" "claimed"
  kb_commit "claim $task_id: $src_col -> in-progress"

  log_info "$task_id claimed: $src_col -> in-progress"
}

cmd_review() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Find task across all boards
  local task_file src_col board_dir
  if ! task_file=$(find_task_file "$task_id"); then
    die "$task_id not found in any board"
  fi
  src_col=$(basename "$(dirname "$task_file")")
  board_dir=$(dirname "$(dirname "$task_file")")

  # Idempotency: already in review
  if [ "$src_col" = "review" ]; then
    log_info "$task_id already in review"
    exit 0
  fi

  if [ "$src_col" != "in-progress" ]; then
    append_conflict "$task_id" "state-mismatch: expected=in-progress actual=$src_col"
    die "$task_id is in '$src_col', expected 'in-progress'"
  fi
  require_clean_git

  local dst="$board_dir/review/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$task_file")

  move_task_file "$task_id" "in-progress" "review" "$board_dir"

  if ! $DRY_RUN; then
    require_version_unchanged "$dst" "$expected_version"
    fm_set "$dst" "assigned_to" "null"
    fm_set "$dst" "review_requested_from" "$_REVIEWERS_YAML"
    fm_append_acted "$dst" "$KB_AGENT" "moved_to_review"
    fm_bump_version "$dst"
  fi

  append_activity "$task_id" "moved_to_review"
  kb_commit "review $task_id: in-progress -> review"

  # Trigger agent review in background (non-fatal)
  if ! $DRY_RUN; then
    if [ -x "$SCRIPTS_DIR/trigger-agent-review.sh" ]; then
      log_info "Triggering agent review for $task_id..."
      bash "$SCRIPTS_DIR/trigger-agent-review.sh" "$task_id" 200>&- &
    else
      log_info "No trigger-agent-review.sh found; skipping auto-trigger"
    fi
  else
    log_info "[dry-run] Would trigger agent review for $task_id"
  fi

  log_info "$task_id moved to review: in-progress -> review"
}

cmd_approve() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Find task across all boards
  local task_file src_col board_dir
  if ! task_file=$(find_task_file "$task_id"); then
    die "$task_id not found in any board"
  fi
  src_col=$(basename "$(dirname "$task_file")")
  board_dir=$(dirname "$(dirname "$task_file")")

  # Idempotency: already approved by this agent
  if [ "$src_col" = "review" ]; then
    if grep -q "action: approved" "$task_file" && \
       grep -B1 "action: approved" "$task_file" | grep -q "agent: $KB_AGENT"; then
      log_info "$task_id already approved by $KB_AGENT"
      exit 0
    fi
  fi

  if [ "$src_col" != "review" ]; then
    append_conflict "$task_id" "state-mismatch: expected=review actual=$src_col"
    die "$task_id is in '$src_col', expected 'review'"
  fi

  local expected_version
  expected_version=$(fm_get_version "$task_file")

  if ! $DRY_RUN; then
    require_version_unchanged "$task_file" "$expected_version"
    fm_append_acted "$task_file" "$KB_AGENT" "approved"
    fm_bump_version "$task_file"
  fi

  append_activity "$task_id" "approved"
  kb_commit "approve $task_id: $KB_AGENT approved"

  log_info "$task_id approved by $KB_AGENT"
}

cmd_resubmit() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Find task across all boards
  local task_file src_col
  if ! task_file=$(find_task_file "$task_id"); then
    die "$task_id not found in any board"
  fi
  src_col=$(basename "$(dirname "$task_file")")

  if [ "$src_col" != "review" ]; then
    append_conflict "$task_id" "state-mismatch: expected=review actual=$src_col"
    die "$task_id is in '$src_col', expected 'review'"
  fi

  local expected_version
  expected_version=$(fm_get_version "$task_file")

  if ! $DRY_RUN; then
    require_version_unchanged "$task_file" "$expected_version"
    fm_append_acted "$task_file" "$KB_AGENT" "resubmitted"
    fm_bump_version "$task_file"
  fi

  append_activity "$task_id" "resubmitted" "re-triggered agent review after fix"
  kb_commit "resubmit $task_id: re-triggered agent review"

  # Trigger agent review in background (non-fatal)
  if ! $DRY_RUN; then
    if [ -x "$SCRIPTS_DIR/trigger-agent-review.sh" ]; then
      log_info "Re-triggering agent review for $task_id..."
      bash "$SCRIPTS_DIR/trigger-agent-review.sh" "$task_id" 200>&- &
    else
      log_info "No trigger-agent-review.sh found; skipping auto-trigger"
    fi
  else
    log_info "[dry-run] Would trigger agent review for $task_id"
  fi

  log_info "$task_id resubmitted for agent review"
}

cmd_status() {
  # Aggregate counts across all board dirs
  local col board_dir
  declare -A col_counts
  for col in "${_ALL_COLUMNS[@]}"; do
    col_counts["$col"]=0
  done

  while IFS= read -r board_dir; do
    for col in "${_ALL_COLUMNS[@]}"; do
      local count=0
      for f in "$board_dir/$col"/*.md; do [ -f "$f" ] && count=$((count + 1)) || true; done
      col_counts["$col"]=$(( col_counts["$col"] + count ))
    done
  done < <(get_board_dirs)

  echo "=== Kanban Board ==="
  for col in "${_ALL_COLUMNS[@]}"; do
    printf "  %-14s %d\n" "${col}:" "${col_counts[$col]}"
  done
  echo ""

  # In-progress details (all boards)
  local inprogress_count=0
  local inprogress_files=()
  while IFS= read -r board_dir; do
    for f in "$board_dir/in-progress"/*.md; do
      [ -f "$f" ] && inprogress_files+=("$f") && inprogress_count=$((inprogress_count + 1)) || true
    done
  done < <(get_board_dirs)
  if [ "$inprogress_count" -gt 0 ]; then
    echo "── In Progress ──"
    for f in "${inprogress_files[@]}"; do
      [ -f "$f" ] || continue
      local tid tname tassigned
      tid=$(basename "$f" .md)
      tname=$(grep '^title:' "$f" | sed 's/^title: *"//;s/"$//' | head -1)
      tassigned=$(grep '^assigned_to:' "$f" | sed 's/^assigned_to: *//' | head -1)
      echo "  $tid  $tname  (assigned: $tassigned)"
    done
    echo ""
  fi

  # Review details (all boards)
  local review_count=0
  local review_files=()
  while IFS= read -r board_dir; do
    for f in "$board_dir/review"/*.md; do
      [ -f "$f" ] && review_files+=("$f") && review_count=$((review_count + 1)) || true
    done
  done < <(get_board_dirs)
  if [ "$review_count" -gt 0 ]; then
    echo "── In Review ──"
    for f in "${review_files[@]}"; do
      [ -f "$f" ] || continue
      local tid tname tapproved
      tid=$(basename "$f" .md)
      tname=$(grep '^title:' "$f" | sed 's/^title: *"//;s/"$//' | head -1)
      tapproved="no"
      if grep -q "action: approved" "$f"; then
        tapproved="yes"
      fi
      echo "  $tid  $tname  (approved: $tapproved)"
    done
    echo ""
  fi

  # Backlog details (all boards)
  local backlog_count=0
  local backlog_files=()
  while IFS= read -r board_dir; do
    for f in "$board_dir/backlog"/*.md; do
      [ -f "$f" ] && backlog_files+=("$f") && backlog_count=$((backlog_count + 1)) || true
    done
  done < <(get_board_dirs)
  if [ "$backlog_count" -gt 0 ]; then
    echo "── Backlog ──"
    for f in "${backlog_files[@]}"; do
      [ -f "$f" ] || continue
      local tid tname
      tid=$(basename "$f" .md)
      tname=$(grep '^title:' "$f" | sed 's/^title: *"//;s/"$//' | head -1)
      echo "  $tid  $tname"
    done
    echo ""
  fi
}

cmd_batch_review() {
  local tasks=("$@")
  require_sync_ready

  if [ ${#tasks[@]} -eq 0 ]; then
    die "batch-review requires at least one task ID"
  fi

  # Require --confirm
  if ! $CONFIRM; then
    echo "Would move the following tasks to review:"
    for tid in "${tasks[@]}"; do
      echo "  $tid"
    done
    die "Pass --confirm to execute batch-review"
  fi

  # Pre-validate ALL tasks before moving any
  for tid in "${tasks[@]}"; do
    require_task_in "$tid" "in-progress"
  done

  require_clean_git

  # Move each task sequentially
  local moved=0
  for tid in "${tasks[@]}"; do
    cmd_review "$tid"
    moved=$((moved + 1))
  done

  log_info "batch-review complete: $moved tasks moved to review"
}

cmd_complete_sprint() {
  local sprint_id="$1"
  local sprint_file="$KANBAN_ROOT/sprints/$sprint_id.md"

  [ -f "$sprint_file" ] || die "Sprint file not found: $sprint_file"

  local current_status
  current_status=$(grep -m1 "^status:" "$sprint_file" | awk '{print $2}' | tr -d '"')
  [ "$current_status" != "completed" ] || die "Sprint $sprint_id already completed"

  log_info "Completing sprint: $sprint_id"

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] Would mark $sprint_id as completed"
    log_info "[DRY-RUN] Would archive sprint and done tasks"
    log_info "[DRY-RUN] Would check OKR completion"
    return
  fi

  # 1. Mark sprint as completed
  sed -i "s/^status: .*/status: completed/" "$sprint_file"
  log_info "Sprint $sprint_id marked as completed"

  # 2. Archive done tasks for this sprint (search all board dirs)
  local archived_count=0
  local board_dir
  while IFS= read -r board_dir; do
    for task_file in "$board_dir"/done/TASK-*.md; do
      [ -f "$task_file" ] || continue
      local task_sprint
      task_sprint=$(grep -m1 "^sprint:" "$task_file" | awk '{print $2}' | tr -d '"')
      if [ "$task_sprint" = "$sprint_id" ]; then
        mkdir -p "$KANBAN_ROOT/archive/board/done"
        mv "$task_file" "$KANBAN_ROOT/archive/board/done/"
        archived_count=$((archived_count + 1))
      fi
    done
  done < <(get_board_dirs)
  log_info "Archived $archived_count done tasks"

  # 3. Archive the sprint file
  mkdir -p "$KANBAN_ROOT/archive/sprints"
  cp "$sprint_file" "$KANBAN_ROOT/archive/sprints/"
  mv "$sprint_file" "$KANBAN_ROOT/archive/sprints/$sprint_id.md" 2>/dev/null || true
  log_info "Sprint file archived"

  # 4. Check if all sprints of linked OKRs are completed
  local okr_ids
  okr_ids=$(grep -m1 "^okrs:" "$KANBAN_ROOT/archive/sprints/$sprint_id.md" | sed 's/^okrs: *//' | tr -d '[]"' | tr ',' ' ')

  for okr_id in $okr_ids; do
    okr_id=$(echo "$okr_id" | xargs) # trim
    [ -n "$okr_id" ] || continue

    local okr_file="$KANBAN_ROOT/okrs/$okr_id.md"
    [ -f "$okr_file" ] || continue

    local okr_status
    okr_status=$(grep -m1 "^status:" "$okr_file" | awk '{print $2}' | tr -d '"')
    [ "$okr_status" != "completed" ] || continue

    # Find all sprints linked to this OKR
    local all_completed=true
    for sf in "$KANBAN_ROOT/sprints"/sprint-*.md "$KANBAN_ROOT/archive/sprints"/sprint-*.md; do
      [ -f "$sf" ] || continue
      local sf_okrs
      sf_okrs=$(grep -m1 "^okrs:" "$sf" | tr -d '[]"')
      if echo "$sf_okrs" | grep -q "$okr_id"; then
        local sf_status
        sf_status=$(grep -m1 "^status:" "$sf" | awk '{print $2}' | tr -d '"')
        if [ "$sf_status" != "completed" ]; then
          all_completed=false
          break
        fi
      fi
    done

    if [ "$all_completed" = true ]; then
      sed -i "s/^status: .*/status: completed/" "$okr_file"
      log_info "OKR $okr_id marked as completed (all sprints done)"
    else
      log_info "OKR $okr_id still has open sprints"
    fi
  done

  # 5. Commit
  if [ "$NO_COMMIT" = false ]; then
    git -C "$KANBAN_ROOT" add -A
    git -C "$KANBAN_ROOT" commit -m "[KANBAN] complete $sprint_id: encerrar sprint"
    if [ "$NO_PUSH" = false ]; then
      git -C "$KANBAN_ROOT" push || log_warn "Push failed, will retry later"
    fi
  fi

  log_info "Sprint $sprint_id completed successfully"
}

cmd_help() {
  local system_name
  system_name="$(cfg '.system.name' 'kanbania')"
  cat <<HELP
kb — CLI wrapper for ${system_name} kanban automation

Usage: kb [flags] <command> [args...]

Commands:
  claim TASK-XXXX             Move task from backlog to in-progress
  review TASK-XXXX            Move task from in-progress to review (triggers agent)
  approve TASK-XXXX           Add approved annotation to task in review
  resubmit TASK-XXXX          Re-trigger agent review after fix
  complete-sprint SPRINT-ID   Complete sprint, archive tasks, check OKR
  status                      Show board summary
  batch-review T1 T2 ...      Review multiple tasks (requires --confirm)
  help                        Show this help

Flags:
  --dry-run     Show what would be done without making changes
  --no-commit   Apply filesystem changes but skip git commit
  --no-push     Commit changes but skip git push
  --confirm     Required for batch-review
HELP
}

# ── Dispatch ─────────────────────────────────────────────────────────────────

main() {
  # Parse global flags
  local args=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run)   DRY_RUN=true ;;
      --no-commit) NO_COMMIT=true ;;
      --no-push)   NO_PUSH=true ;;
      --confirm)   CONFIRM=true ;;
      *)           args+=("$1") ;;
    esac
    shift
  done

  if [ ${#args[@]} -eq 0 ]; then
    cmd_help
    exit 0
  fi

  local command="${args[0]}"
  local rest=("${args[@]:1}")

  case "$command" in
    claim)
      [ ${#rest[@]} -eq 1 ] || die "Usage: kb claim TASK-XXXX"
      cmd_claim "${rest[0]}"
      ;;
    review)
      [ ${#rest[@]} -eq 1 ] || die "Usage: kb review TASK-XXXX"
      cmd_review "${rest[0]}"
      ;;
    approve)
      [ ${#rest[@]} -eq 1 ] || die "Usage: kb approve TASK-XXXX"
      cmd_approve "${rest[0]}"
      ;;
    resubmit)
      [ ${#rest[@]} -eq 1 ] || die "Usage: kb resubmit TASK-XXXX"
      cmd_resubmit "${rest[0]}"
      ;;
    status)
      cmd_status
      ;;
    complete-sprint)
      [ ${#rest[@]} -eq 1 ] || die "Usage: kb complete-sprint sprint-NNN"
      cmd_complete_sprint "${rest[0]}"
      ;;
    batch-review)
      [ ${#rest[@]} -ge 1 ] || die "Usage: kb batch-review TASK-XXXX TASK-YYYY ... --confirm"
      cmd_batch_review "${rest[@]}"
      ;;
    help|--help|-h)
      cmd_help
      ;;
    *)
      die "Unknown command: $command. Run 'kb help' for usage."
      ;;
  esac
}

main "$@"
