#!/usr/bin/env bash
# kanban-sync-check.sh — Validates kanban git sync invariants.
# Usage: kanban-sync-check.sh [--repo <path>] [--expected-branch <name>]
set -euo pipefail

# Load config (auto-detects KANBAN_ROOT)
source "$(dirname "${BASH_SOURCE[0]}")/lib/config.sh"

EXPECTED_BRANCH=""

usage() {
  cat <<'EOF'
Usage: kanban-sync-check.sh [--repo <path>] [--expected-branch <name>]

Validates kanban git sync invariants before mutating board operations:
1) clean working tree
2) non-detached branch
3) upstream configured
4) local branch not behind or ahead upstream
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      KANBAN_ROOT="${2:?missing value for --repo}"
      shift 2
      ;;
    --expected-branch)
      EXPECTED_BRANCH="${2:?missing value for --expected-branch}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[sync-check] ERROR: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

# Register agent heartbeat
if [ -n "${AGENT:-}" ]; then
  "$(dirname "$0")/agent-heartbeat.sh" "$AGENT" "$PPID"
fi

git -C "$KANBAN_ROOT" rev-parse --is-inside-work-tree >/dev/null

branch="$(git -C "$KANBAN_ROOT" rev-parse --abbrev-ref HEAD)"
if [ "$branch" = "HEAD" ]; then
  echo "[sync-check] ERROR: detached HEAD; select a branch before operating." >&2
  exit 1
fi

if [ -n "$EXPECTED_BRANCH" ] && [ "$branch" != "$EXPECTED_BRANCH" ]; then
  echo "[sync-check] ERROR: current branch '$branch' differs from expected '$EXPECTED_BRANCH'." >&2
  exit 1
fi

if [ -n "$(git -C "$KANBAN_ROOT" status --porcelain)" ]; then
  echo "[sync-check] ERROR: working tree has uncommitted changes." >&2
  git -C "$KANBAN_ROOT" status --short >&2
  exit 1
fi

upstream="$(git -C "$KANBAN_ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [ -z "$upstream" ]; then
  echo "[sync-check] ERROR: branch '$branch' has no upstream configured." >&2
  echo "[sync-check] Hint: git -C \"$KANBAN_ROOT\" push -u origin \"$branch\"" >&2
  exit 1
fi

git -C "$KANBAN_ROOT" fetch --prune origin >/dev/null

counts="$(git -C "$KANBAN_ROOT" rev-list --left-right --count "$upstream...HEAD")"
behind="$(echo "$counts" | awk '{print $1}')"
ahead="$(echo "$counts" | awk '{print $2}')"

if [ "${behind:-0}" -gt 0 ]; then
  echo "[sync-check] ERROR: local branch is behind upstream by $behind commit(s)." >&2
  echo "[sync-check] Run: git -C \"$KANBAN_ROOT\" pull --rebase" >&2
  exit 1
fi

if [ "${ahead:-0}" -gt 0 ]; then
  echo "[sync-check] ERROR: local branch has $ahead commit(s) not pushed." >&2
  echo "[sync-check] Run: git -C \"$KANBAN_ROOT\" push" >&2
  exit 1
fi

echo "[sync-check] OK: branch=$branch upstream=$upstream clean and synchronized."
