#!/usr/bin/env bash
# lib-kanban.sh — shared functions for kanban automation scripts.
# Source this file: source "$(dirname "$0")/lib-kanban.sh"
#
# DEPRECATED: prefer sourcing lib/config.sh directly for new scripts.
# This shim exists for backward compatibility.

_LIB_KANBAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/config.sh
source "${_LIB_KANBAN_DIR}/lib/config.sh"

KANBAN_DIR="${KANBAN_ROOT}"
BOARD_DIR="${KANBAN_ROOT}/board"
SCRIPTS_DIR="${KANBAN_ROOT}/scripts"

get_project_repo() {
  local project="$1"
  local readme="${KANBAN_ROOT}/projects/${project}/README.md"
  if [ -f "$readme" ]; then
    grep '^repo:' "$readme" | sed 's/^repo: *//' | tr -d '"' | tr -d ' '
  fi
}
