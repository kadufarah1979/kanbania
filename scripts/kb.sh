#!/usr/bin/env bash
# kb — CLI wrapper for kanban automation
# Reduces per-task transitions from ~15 manual operations to 1 command.
#
# Usage: kb [--dry-run] [--no-commit] [--no-push] [--confirm] <command> [args...]
# Commands: claim, review, approve, resubmit, status, batch-review, help

set -euo pipefail

# ── Constants ────────────────────────────────────────────────────────────────

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
LOGS_DIR="$KANBAN_DIR/logs"
SCRIPTS_DIR="$KANBAN_DIR/scripts"
LOCK_DIR="/tmp/kb-locks"
GLOBAL_LOCK_FILE="$LOCK_DIR/board-global.lock"
AGENT="claude-code"

# ── Flags ────────────────────────────────────────────────────────────────────

DRY_RUN=false
NO_COMMIT=false
NO_PUSH=false
CONFIRM=false

# ── Utilities ────────────────────────────────────────────────────────────────

now() { date -Iseconds | sed 's/+00:00$/-03:00/'; }

log_info()  { echo "[kb] $*"; }
log_error() { echo "[kb] ERROR: $*" >&2; }
die()       { log_error "$@"; exit 1; }

run() {
  if $DRY_RUN; then
    log_info "[dry-run] $*"
  else
    "$@"
  fi
}

# ── Guards ───────────────────────────────────────────────────────────────────

find_task_column() {
  local task_id="$1"
  for col in backlog todo in-progress review done; do
    if [ -f "$BOARD_DIR/$col/$task_id.md" ]; then
      echo "$col"
      return 0
    fi
  done
  return 1
}

require_task_in() {
  local task_id="$1"
  local expected_col="$2"

  if [ -f "$BOARD_DIR/$expected_col/$task_id.md" ]; then
    return 0
  fi

  local actual_col
  if actual_col=$(find_task_column "$task_id"); then
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
  status=$(git -C "$KANBAN_DIR" status --porcelain)
  if [ -n "$status" ]; then
    die "Kanban repo has uncommitted changes. Commit or stash first.\n$status"
  fi
}

require_sync_ready() {
  if $DRY_RUN; then
    return 0
  fi
  [ -x "$SCRIPTS_DIR/kanban-sync-check.sh" ] || die "Missing sync checker: $SCRIPTS_DIR/kanban-sync-check.sh"
  "$SCRIPTS_DIR/kanban-sync-check.sh" --repo "$KANBAN_DIR"
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
  # Keep backward compatibility: inject version close to id for stable frontmatter shape.
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
  local title
  # Try to extract title from whatever column the card is in
  local card_file
  for col in backlog in-progress review done; do
    if [ -f "$BOARD_DIR/$col/$task_id.md" ]; then
      card_file="$BOARD_DIR/$col/$task_id.md"
      break
    fi
  done
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

  jq -cn \
    --arg ts "$ts" \
    --arg agent "$AGENT" \
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
  local project="unknown"
  local card_file
  for col in backlog todo in-progress review done; do
    if [ -f "$BOARD_DIR/$col/$task_id.md" ]; then
      card_file="$BOARD_DIR/$col/$task_id.md"
      break
    fi
  done
  if [ -n "${card_file:-}" ]; then
    project=$(grep '^project:' "$card_file" | sed 's/^project: *//' | head -1)
  fi
  jq -cn \
    --arg ts "$ts" \
    --arg agent "$AGENT" \
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
    if git -C "$KANBAN_DIR" push 2>/dev/null; then
      return 0
    fi
    log_info "[push] Attempt $i failed (non-fast-forward). Rebasing..."
    git -C "$KANBAN_DIR" pull --rebase origin main
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
  git -C "$KANBAN_DIR" add -A
  git -C "$KANBAN_DIR" commit -m "$msg"
  if ! $NO_PUSH; then
    kb_push_with_retry
  else
    log_info "[no-push] Skipping git push after commit: $msg"
  fi
}

ensure_task_unique() {
  local task_id="$1"
  local hits=0
  local col
  for col in backlog todo in-progress review done; do
    if [ -f "$BOARD_DIR/$col/$task_id.md" ]; then
      hits=$((hits + 1))
    fi
  done
  if [ "$hits" -ne 1 ]; then
    append_conflict "$task_id" "postcondition-failed: expected unique card copy, found=$hits"
    die "Postcondition failed for $task_id: expected exactly 1 copy, found $hits"
  fi
}

assert_post_move() {
  local task_id="$1" src_col="$2" dst_col="$3"
  if [ -f "$BOARD_DIR/$src_col/$task_id.md" ] || [ ! -f "$BOARD_DIR/$dst_col/$task_id.md" ]; then
    append_conflict "$task_id" "postcondition-failed: move $src_col->$dst_col not materialized"
    die "Postcondition failed for $task_id: move $src_col -> $dst_col not materialized"
  fi
  ensure_task_unique "$task_id"
}

move_task_file() {
  local task_id="$1" src_col="$2" dst_col="$3"
  local src="$BOARD_DIR/$src_col/$task_id.md"
  local dst="$BOARD_DIR/$dst_col/$task_id.md"
  run mv "$src" "$dst"
  if ! $DRY_RUN; then
    assert_post_move "$task_id" "$src_col" "$dst_col"
  fi
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_claim() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Idempotency: already in in-progress with correct assignment
  if [ -f "$BOARD_DIR/in-progress/$task_id.md" ]; then
    if grep -q "^assigned_to: $AGENT" "$BOARD_DIR/in-progress/$task_id.md"; then
      log_info "$task_id already in in-progress (assigned to $AGENT)"
      exit 0
    fi
  fi

  # Accept tasks from both backlog and todo
  local src_col=""
  if [ -f "$BOARD_DIR/todo/$task_id.md" ]; then
    src_col="todo"
  elif [ -f "$BOARD_DIR/backlog/$task_id.md" ]; then
    src_col="backlog"
  else
    die "$task_id not found in todo/ or backlog/"
  fi
  require_clean_git

  local src="$BOARD_DIR/$src_col/$task_id.md"
  local dst="$BOARD_DIR/in-progress/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$src")

  move_task_file "$task_id" "$src_col" "in-progress"

  if ! $DRY_RUN; then
    require_version_unchanged "$dst" "$expected_version"
    fm_set "$dst" "assigned_to" "$AGENT"
    fm_append_acted "$dst" "$AGENT" "claimed"
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

  # Idempotency: already in review
  if [ -f "$BOARD_DIR/review/$task_id.md" ]; then
    log_info "$task_id already in review"
    exit 0
  fi

  require_task_in "$task_id" "in-progress"
  require_clean_git

  local src="$BOARD_DIR/in-progress/$task_id.md"
  local dst="$BOARD_DIR/review/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$src")

  move_task_file "$task_id" "in-progress" "review"

  if ! $DRY_RUN; then
    require_version_unchanged "$dst" "$expected_version"
    fm_set "$dst" "assigned_to" "null"
    fm_set "$dst" "review_requested_from" "[codex]"
    fm_append_acted "$dst" "$AGENT" "moved_to_review"
    fm_bump_version "$dst"
  fi

  append_activity "$task_id" "moved_to_review"
  kb_commit "review $task_id: in-progress -> review"

  # Trigger codex review in background (non-fatal)
  if ! $DRY_RUN; then
    log_info "Triggering codex review for $task_id..."
    bash "$SCRIPTS_DIR/trigger-codex-review.sh" "$task_id" 200>&- &
  else
    log_info "[dry-run] Would trigger codex review for $task_id"
  fi

  log_info "$task_id moved to review: in-progress -> review"
}

cmd_approve() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  # Idempotency: already approved by this agent
  if [ -f "$BOARD_DIR/review/$task_id.md" ]; then
    if grep -q "action: approved" "$BOARD_DIR/review/$task_id.md" && \
       grep -B1 "action: approved" "$BOARD_DIR/review/$task_id.md" | grep -q "agent: $AGENT"; then
      log_info "$task_id already approved by $AGENT"
      exit 0
    fi
  fi

  require_task_in "$task_id" "review"

  local file="$BOARD_DIR/review/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$file")

  if ! $DRY_RUN; then
    require_version_unchanged "$file" "$expected_version"
    fm_append_acted "$file" "$AGENT" "approved"
    fm_bump_version "$file"
  fi

  append_activity "$task_id" "approved"
  kb_commit "approve $task_id: $AGENT approved"

  log_info "$task_id approved by $AGENT"
}

cmd_resubmit() {
  local task_id="$1"
  require_sync_ready
  acquire_lock "$task_id"
  trap release_lock EXIT

  require_task_in "$task_id" "review"

  local file="$BOARD_DIR/review/$task_id.md"
  local expected_version
  expected_version=$(fm_get_version "$file")

  if ! $DRY_RUN; then
    require_version_unchanged "$file" "$expected_version"
    fm_append_acted "$file" "$AGENT" "resubmitted"
    fm_bump_version "$file"
  fi

  append_activity "$task_id" "resubmitted" "re-triggered codex review after fix"
  kb_commit "resubmit $task_id: re-triggered codex review"

  # Trigger codex review in background (non-fatal)
  if ! $DRY_RUN; then
    log_info "Re-triggering codex review for $task_id..."
    bash "$SCRIPTS_DIR/trigger-codex-review.sh" "$task_id" 200>&- &
  else
    log_info "[dry-run] Would trigger codex review for $task_id"
  fi

  log_info "$task_id resubmitted for codex review"
}

cmd_status() {
  local backlog_count=0 inprogress_count=0 review_count=0 done_count=0

  # Count cards per column
  for f in "$BOARD_DIR/backlog"/*.md; do [ -f "$f" ] && ((backlog_count++)) || true; done
  for f in "$BOARD_DIR/in-progress"/*.md; do [ -f "$f" ] && ((inprogress_count++)) || true; done
  for f in "$BOARD_DIR/review"/*.md; do [ -f "$f" ] && ((review_count++)) || true; done
  for f in "$BOARD_DIR/done"/*.md; do [ -f "$f" ] && ((done_count++)) || true; done

  echo "=== Kanban Board ==="
  echo "  backlog:     $backlog_count"
  echo "  in-progress: $inprogress_count"
  echo "  review:      $review_count"
  echo "  done:        $done_count"
  echo ""

  # In-progress details
  if [ "$inprogress_count" -gt 0 ]; then
    echo "── In Progress ──"
    for f in "$BOARD_DIR/in-progress"/*.md; do
      [ -f "$f" ] || continue
      local tid tname tassigned
      tid=$(basename "$f" .md)
      tname=$(grep '^title:' "$f" | sed 's/^title: *"//;s/"$//' | head -1)
      tassigned=$(grep '^assigned_to:' "$f" | sed 's/^assigned_to: *//' | head -1)
      echo "  $tid  $tname  (assigned: $tassigned)"
    done
    echo ""
  fi

  # Review details
  if [ "$review_count" -gt 0 ]; then
    echo "── In Review ──"
    for f in "$BOARD_DIR/review"/*.md; do
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

  # Backlog details
  if [ "$backlog_count" -gt 0 ]; then
    echo "── Backlog ──"
    for f in "$BOARD_DIR/backlog"/*.md; do
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
    ((moved++))
  done

  log_info "batch-review complete: $moved tasks moved to review"
}

cmd_complete_sprint() {
  local sprint_id="$1"
  local sprint_file="$KANBAN_DIR/sprints/$sprint_id.md"

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

  # 2. Archive done tasks for this sprint
  local archived_count=0
  for task_file in "$BOARD_DIR"/done/TASK-*.md; do
    [ -f "$task_file" ] || continue
    local task_sprint
    task_sprint=$(grep -m1 "^sprint:" "$task_file" | awk '{print $2}' | tr -d '"')
    if [ "$task_sprint" = "$sprint_id" ]; then
      mkdir -p "$KANBAN_DIR/archive/board/done"
      mv "$task_file" "$KANBAN_DIR/archive/board/done/"
      ((archived_count++))
    fi
  done
  log_info "Archived $archived_count done tasks"

  # 3. Archive the sprint file
  mkdir -p "$KANBAN_DIR/archive/sprints"
  cp "$sprint_file" "$KANBAN_DIR/archive/sprints/"
  mv "$sprint_file" "$KANBAN_DIR/archive/sprints/$sprint_id.md" 2>/dev/null || true
  log_info "Sprint file archived"

  # 4. Check if all sprints of linked OKRs are completed
  local okr_ids
  okr_ids=$(grep -m1 "^okrs:" "$KANBAN_DIR/archive/sprints/$sprint_id.md" | sed 's/^okrs: *//' | tr -d '[]"' | tr ',' ' ')

  for okr_id in $okr_ids; do
    okr_id=$(echo "$okr_id" | xargs) # trim
    [ -n "$okr_id" ] || continue

    local okr_file="$KANBAN_DIR/okrs/$okr_id.md"
    [ -f "$okr_file" ] || continue

    local okr_status
    okr_status=$(grep -m1 "^status:" "$okr_file" | awk '{print $2}' | tr -d '"')
    [ "$okr_status" != "completed" ] || continue

    # Find all sprints linked to this OKR
    local all_completed=true
    for sf in "$KANBAN_DIR/sprints"/sprint-*.md "$KANBAN_DIR/archive/sprints"/sprint-*.md; do
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
    cd "$KANBAN_DIR"
    git add -A
    git commit -m "[KANBAN] complete $sprint_id: encerrar sprint"
    if [ "$NO_PUSH" = false ]; then
      git push || log_warn "Push failed, will retry later"
    fi
  fi

  log_info "Sprint $sprint_id completed successfully"
}

cmd_help() {
  cat <<'HELP'
kb — CLI wrapper for kanban automation

Usage: kb [flags] <command> [args...]

Commands:
  claim TASK-XXXX             Move task from backlog to in-progress
  review TASK-XXXX            Move task from in-progress to review (triggers codex)
  approve TASK-XXXX           Add approved annotation to task in review
  resubmit TASK-XXXX          Re-trigger codex review after fix
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
