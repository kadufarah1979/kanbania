#!/usr/bin/env bash
# Syncs the Codex worktree with main branch.
#
# Usage:
#   sync-codex-worktree.sh pull   — Rebase codex-work on top of latest main (run BEFORE Codex starts)
#   sync-codex-worktree.sh merge  — Merge codex-work into main (run AFTER Codex task is approved)
#
# This prevents git conflicts between claude-code (works on main) and codex (works on codex-work).

set -euo pipefail

ACTION="${1:?Usage: sync-codex-worktree.sh <pull|merge>}"
MAIN_DIR="/home/carlosfarah/Projects/aquario"
CODEX_DIR="/home/carlosfarah/Projects/aquario-codex"

case "$ACTION" in
  pull)
    echo "[sync] Rebasing codex-work onto latest main..."
    cd "$CODEX_DIR"
    git fetch origin 2>/dev/null || true
    git rebase main
    echo "[sync] codex-work is now up to date with main"
    ;;

  merge)
    echo "[sync] Merging codex-work into main..."
    cd "$MAIN_DIR"

    # Check if there are actual differences
    DIFF_COUNT=$(git diff main..codex-work --stat | wc -l)
    if [ "$DIFF_COUNT" -eq 0 ]; then
      echo "[sync] No changes to merge"
      exit 0
    fi

    git merge codex-work --no-edit
    echo "[sync] Merged codex-work into main ($DIFF_COUNT files changed)"

    # Reset codex-work to new main HEAD
    cd "$CODEX_DIR"
    git reset --hard main
    echo "[sync] Reset codex-work to main HEAD"
    ;;

  *)
    echo "ERROR: Unknown action '$ACTION'. Use 'pull' or 'merge'."
    exit 1
    ;;
esac
