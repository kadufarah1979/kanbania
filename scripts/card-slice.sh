#!/usr/bin/env bash
# card-slice.sh — Extrai partes relevantes de um card kanban.
#
# Usage: card-slice.sh <TASK-ID> <mode>
#   mode=full    — card completo
#   mode=rework  — frontmatter resumido + ultima secao de notas (pendencias QA)
#   mode=review  — frontmatter + Descricao + Criterios de Aceite
#   mode=summary — apenas id, title, project, priority (1 linha)

set -euo pipefail

TASK_ID="${1:?Usage: card-slice.sh <TASK-ID> <mode>}"
MODE="${2:?Usage: card-slice.sh <TASK-ID> <full|rework|review|summary>}"
source "$(dirname "$0")/lib/config.sh"
BOARD_DIR="${KANBAN_ROOT}/board"

# Find card in any column
TASK_FILE=""
for col in in-progress review todo backlog done; do
  if [ -f "$BOARD_DIR/$col/$TASK_ID.md" ]; then
    TASK_FILE="$BOARD_DIR/$col/$TASK_ID.md"
    break
  fi
done

if [ -z "$TASK_FILE" ]; then
  echo "ERROR: $TASK_ID not found in board/" >&2
  exit 1
fi

case "$MODE" in
  full)
    cat "$TASK_FILE"
    ;;

  summary)
    # 1-line: id | title | project | priority
    local_id=$(grep '^id:' "$TASK_FILE" | sed 's/^id: *//')
    local_title=$(grep '^title:' "$TASK_FILE" | sed 's/^title: *"//;s/"$//')
    local_project=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *//')
    local_priority=$(grep '^priority:' "$TASK_FILE" | sed 's/^priority: *//')
    echo "$local_id | $local_title | $local_project | $local_priority"
    ;;

  rework)
    # Frontmatter resumido (id, title, project) + ultima secao de notas
    local_id=$(grep '^id:' "$TASK_FILE" | sed 's/^id: *//')
    local_title=$(grep '^title:' "$TASK_FILE" | sed 's/^title: *"//;s/"$//')
    local_project=$(grep '^project:' "$TASK_FILE" | sed 's/^project: *//')
    echo "id: $local_id"
    echo "title: $local_title"
    echo "project: $local_project"
    echo ""
    # Criterios de aceite (needed for context)
    awk '/^## Criterios de Aceite/{found=1} found && /^## / && !/^## Criterios de Aceite/{exit} found{print}' "$TASK_FILE"
    echo ""
    # Last notes section (contains QA pendencias)
    last_header=$(grep -n '^### ' "$TASK_FILE" | tail -1 | cut -d: -f1)
    if [ -n "$last_header" ]; then
      echo "## Pendencias QA"
      tail -n +"$last_header" "$TASK_FILE"
    fi
    ;;

  review)
    # Frontmatter + Descricao + Criterios de Aceite (no progress history)
    # Print up to end of Criterios de Aceite section
    awk '
      BEGIN { in_criterios=0; past_criterios=0 }
      /^## Criterios de Aceite/ { in_criterios=1 }
      /^## / && !/^## Criterios de Aceite/ && !/^## Descricao/ && in_criterios { past_criterios=1 }
      !past_criterios { print }
    ' "$TASK_FILE"
    ;;

  *)
    echo "ERROR: unknown mode '$MODE'. Use: full|rework|review|summary" >&2
    exit 1
    ;;
esac
