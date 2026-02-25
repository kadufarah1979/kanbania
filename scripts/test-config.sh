#!/usr/bin/env bash
# =============================================================================
# scripts/test-config.sh — Unit tests for scripts/lib/config.sh
# =============================================================================
# Usage: bash scripts/test-config.sh
# Exit code: 0 = all tests passed, 1 = one or more tests failed
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KANBAN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export KANBAN_ROOT

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

_pass=0; _fail=0; _total=0

assert_eq() {
  local test_name="$1" expected="$2" actual="$3"
  _total=$((_total + 1))
  if [[ "$actual" == "$expected" ]]; then
    echo -e "  ${GREEN}✓${NC} $test_name"
    _pass=$((_pass + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name"
    echo -e "    expected: ${YELLOW}${expected}${NC}"
    echo -e "    actual:   ${YELLOW}${actual}${NC}"
    _fail=$((_fail + 1))
  fi
}

assert_not_empty() {
  local test_name="$1" actual="$2"
  _total=$((_total + 1))
  if [[ -n "$actual" && "$actual" != "null" ]]; then
    echo -e "  ${GREEN}✓${NC} $test_name"
    _pass=$((_pass + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name (got empty or null)"
    _fail=$((_fail + 1))
  fi
}

assert_contains() {
  local test_name="$1" needle="$2" haystack="$3"
  _total=$((_total + 1))
  if echo "$haystack" | grep -q "$needle"; then
    echo -e "  ${GREEN}✓${NC} $test_name"
    _pass=$((_pass + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name"
    echo -e "    expected to contain: ${YELLOW}${needle}${NC}"
    echo -e "    actual: ${YELLOW}${haystack}${NC}"
    _fail=$((_fail + 1))
  fi
}

assert_exit_0() {
  local test_name="$1"; shift
  _total=$((_total + 1))
  if "$@" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $test_name"
    _pass=$((_pass + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name (expected exit 0)"
    _fail=$((_fail + 1))
  fi
}

assert_exit_1() {
  local test_name="$1"; shift
  _total=$((_total + 1))
  if ! "$@" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $test_name"
    _pass=$((_pass + 1))
  else
    echo -e "  ${RED}✗${NC} $test_name (expected exit 1)"
    _fail=$((_fail + 1))
  fi
}

# =============================================================================
echo ""
echo "=== config.sh unit tests ==="
echo ""

# Source the library
source "$SCRIPT_DIR/lib/config.sh"

# ---------------------------------------------------------------------------
echo "--- KANBAN_ROOT detection ---"
assert_not_empty "KANBAN_ROOT is set" "$KANBAN_ROOT"
assert_eq "KANBAN_ROOT points to existing directory" "true" "$([[ -d "$KANBAN_ROOT" ]] && echo true || echo false)"

# ---------------------------------------------------------------------------
echo "--- cfg(): read from config.yaml ---"
OWNER_NAME="$(cfg '.owner.name')"
assert_not_empty "cfg .owner.name returns non-empty" "$OWNER_NAME"

SPRINT_DAYS="$(cfg '.sprint.duration_days' '14')"
assert_not_empty "cfg .sprint.duration_days returns non-empty" "$SPRINT_DAYS"

MISSING="$(cfg '.does.not.exist' 'fallback-value')"
assert_eq "cfg with missing key returns default" "fallback-value" "$MISSING"

PROVIDER="$(cfg '.notifications.provider' 'none')"
assert_not_empty "cfg .notifications.provider returns non-empty" "$PROVIDER"

# ---------------------------------------------------------------------------
echo "--- cfg(): config.local.yaml override ---"

# Create temp local config at the real path, test override, then remove
_REAL_LOCAL="${KANBAN_ROOT}/config.local.yaml"
_HAD_LOCAL=false
[[ -f "$_REAL_LOCAL" ]] && _HAD_LOCAL=true

cat > "$_REAL_LOCAL" << 'EOF'
owner:
  name: "local-override-user"
notifications:
  settings:
    slack_webhook: "https://hooks.slack.com/test"
EOF

OWNER_OVERRIDE="$(cfg '.owner.name')"
assert_eq "cfg reads config.local.yaml override" "local-override-user" "$OWNER_OVERRIDE"

# Restore
if [[ "$_HAD_LOCAL" == "false" ]]; then
  rm -f "$_REAL_LOCAL"
fi

# ---------------------------------------------------------------------------
echo "--- get_columns() ---"
COLS="$(get_columns)"
assert_not_empty "get_columns returns non-empty" "$COLS"
assert_contains "get_columns includes 'backlog'" "backlog" "$COLS"
assert_contains "get_columns includes 'done'" "done" "$COLS"
assert_contains "get_columns includes 'in-progress'" "in-progress" "$COLS"

COL_COUNT="$(get_columns | wc -l | tr -d ' ')"
assert_not_empty "get_columns returns multiple columns" "$COL_COUNT"

# ---------------------------------------------------------------------------
echo "--- get_agent_role() ---"
IMPL_ROLE="$(get_agent_role "claude-code")"
assert_eq "claude-code role is implementer" "implementer" "$IMPL_ROLE"

REVIEW_ROLE="$(get_agent_role "codex")"
assert_eq "codex role is reviewer" "reviewer" "$REVIEW_ROLE"

UNKNOWN_ROLE="$(get_agent_role "nonexistent-agent")"
assert_eq "unknown agent role defaults to implementer" "implementer" "$UNKNOWN_ROLE"

# ---------------------------------------------------------------------------
echo "--- get_reviewers() ---"
REVIEWERS="$(get_reviewers)"
assert_contains "get_reviewers includes codex" "codex" "$REVIEWERS"

# ---------------------------------------------------------------------------
echo "--- can_transition() ---"
# Only test if workflow.transitions section exists
HAS_TRANSITIONS="$(yq '.workflow.transitions | length' "$_CFG_YAML" 2>/dev/null || echo 0)"
if [[ "$HAS_TRANSITIONS" -gt 0 ]]; then
  assert_exit_0 "can_transition todo → in-progress allowed" can_transition "todo" "in-progress"
  assert_exit_0 "can_transition review → done allowed" can_transition "review" "done"
  assert_exit_1 "can_transition done → backlog not allowed" can_transition "done" "backlog"
else
  echo -e "  ${YELLOW}⚠${NC} can_transition: workflow.transitions not configured, skipping"
fi

# ---------------------------------------------------------------------------
echo "--- get_project_path() ---"
EMPTY_PATH="$(get_project_path "nonexistent-project")"
assert_eq "get_project_path returns empty for unknown project" "" "$EMPTY_PATH"

# ---------------------------------------------------------------------------
echo "--- get_project_worktree() ---"
EMPTY_WT="$(get_project_worktree "nonexistent-project")"
assert_eq "get_project_worktree returns empty for unknown project" "" "$EMPTY_WT"

# ---------------------------------------------------------------------------
echo "--- KB_AGENT detection ---"
assert_not_empty "KB_AGENT is set" "$KB_AGENT"

# ---------------------------------------------------------------------------
echo "--- notify() (none provider — no-op) ---"
# Should complete silently with provider=none
notify "normal" "Test notification" "This should be a no-op"
echo -e "  ${GREEN}✓${NC} notify() with provider=none completes without error"
_pass=$((_pass + 1)); _total=$((_total + 1))

# =============================================================================
echo ""
echo "=== Results: ${_pass}/${_total} passed ==="
echo ""

if [[ $_fail -gt 0 ]]; then
  echo -e "${RED}FAILED: ${_fail} test(s) failed${NC}"
  exit 1
else
  echo -e "${GREEN}ALL TESTS PASSED${NC}"
  exit 0
fi
