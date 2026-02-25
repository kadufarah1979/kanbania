#!/usr/bin/env bash
# sync-agent-worktree.sh — Syncs the reviewer agent's worktree with main branch.
#
# Usage:
#   sync-agent-worktree.sh pull <project>    — Rebase agent worktree on top of latest main
#   sync-agent-worktree.sh merge <project>   — Merge agent worktree into main
#
# Project path and worktree path are read from config.local.yaml via config.sh.

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

ACTION="${1:?Usage: sync-agent-worktree.sh <pull|merge> [project]}"
PROJECT="${2:-}"

# Resolve reviewer agent
REVIEWER_AGENT="$(get_reviewers | head -1)"
if [ -z "$REVIEWER_AGENT" ]; then
  echo "[sync] ERROR: no reviewer agent configured" >&2
  exit 1
fi

# Resolve paths from config
if [ -n "$PROJECT" ]; then
  MAIN_DIR="$(get_project_path "$PROJECT")"
  AGENT_DIR="$(get_project_worktree "$PROJECT" "$REVIEWER_AGENT")"
else
  # Legacy: no project specified — try first configured project path
  MAIN_DIR=""
  AGENT_DIR=""
fi

if [ -z "$MAIN_DIR" ] || [ ! -d "$MAIN_DIR" ]; then
  echo "[sync] ERROR: cannot resolve project directory${PROJECT:+ for '$PROJECT'}." >&2
  echo "[sync] Add project paths to config.local.yaml under projects.$PROJECT.path" >&2
  exit 1
fi

if [ -z "$AGENT_DIR" ] || [ ! -d "$AGENT_DIR" ]; then
  echo "[sync] ERROR: cannot resolve worktree directory for $REVIEWER_AGENT${PROJECT:+ / '$PROJECT'}." >&2
  echo "[sync] Add worktree path to config.local.yaml under projects.$PROJECT.worktrees.$REVIEWER_AGENT" >&2
  exit 1
fi

# ── Actions ───────────────────────────────────────────────────────────────────

case "$ACTION" in
  pull)
    echo "[sync] Rebasing ${REVIEWER_AGENT} worktree onto latest main..."
    git -C "$AGENT_DIR" fetch origin 2>/dev/null || true
    git -C "$AGENT_DIR" rebase main
    echo "[sync] $REVIEWER_AGENT worktree is now up to date with main"
    ;;

  merge)
    echo "[sync] Merging ${REVIEWER_AGENT} worktree into main..."
    local_branch="$(git -C "$AGENT_DIR" rev-parse --abbrev-ref HEAD)"
    DIFF_COUNT=$(git -C "$MAIN_DIR" diff "main..$local_branch" --stat 2>/dev/null | wc -l || echo 0)
    if [ "$DIFF_COUNT" -eq 0 ]; then
      echo "[sync] No changes to merge"
      exit 0
    fi
    git -C "$MAIN_DIR" merge "$local_branch" --no-edit
    echo "[sync] Merged $local_branch into main ($DIFF_COUNT lines changed)"
    # Reset reviewer worktree to new main HEAD
    git -C "$AGENT_DIR" reset --hard main
    echo "[sync] Reset $REVIEWER_AGENT worktree to main HEAD"
    ;;

  *)
    echo "[sync] ERROR: Unknown action '$ACTION'. Use 'pull' or 'merge'." >&2
    exit 1
    ;;
esac
