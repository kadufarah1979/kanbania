#!/usr/bin/env bash
# lib-kanban.sh — funcoes compartilhadas pelos scripts de automacao kanban.
# Source este arquivo nos scripts: source "$SCRIPTS_DIR/lib-kanban.sh"

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
SCRIPTS_DIR="$KANBAN_DIR/scripts"

get_project_repo() {
  local project="$1"
  local readme="$KANBAN_DIR/projects/$project/README.md"
  if [ -f "$readme" ]; then
    grep '^repo:' "$readme" | sed 's/^repo: *//' | tr -d '"' | tr -d ' '
  fi
}
