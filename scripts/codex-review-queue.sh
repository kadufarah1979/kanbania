#!/usr/bin/env bash
# codex-review-queue.sh — Lista cards em review para sessao de QA
#
# Uso:
#   codex-review-queue.sh <projeto>
#   - Projeto OBRIGATORIO (ex.: aquario, kanbania)
#   - NUNCA operar sem projeto definido
#
# Saida:
#   PROJECT: <slug>
#   ---
#   TASK-XXXX (priority)

set -euo pipefail

source "$(dirname "$0")/lib/config.sh"
KANBAN_DIR="${KANBAN_ROOT}"

SESSION_PROJECT="${1:-}"

if [ -z "$SESSION_PROJECT" ]; then
  echo "ERRO: projeto obrigatorio." >&2
  echo "Uso: codex-review-queue.sh <projeto>" >&2
  echo "Exemplo: codex-review-queue.sh aquario" >&2
  exit 1
fi

declare -A CARD_PROJECT
declare -A CARD_PRIORITY
declare -A CARD_PATH
declare -a PROJECT_TASKS=()
declare -a ALL_TASKS=()

rank_priority() {
  case "$1" in
    critical) echo 0 ;;
    high) echo 1 ;;
    medium) echo 2 ;;
    low) echo 3 ;;
    *) echo 2 ;;
  esac
}

while IFS= read -r f; do
  [ -f "$f" ] || continue

  task_id=$(basename "$f" .md)
  project=$(grep '^project:' "$f" | head -1 | sed 's/^project:\s*//' | tr -d '"' | tr -d ' ')
  priority=$(grep '^priority:' "$f" | head -1 | sed 's/^priority:\s*//' | tr -d '"' | tr -d ' ')
  CARD_PATH["$task_id"]="$f"

  CARD_PROJECT["$task_id"]="$project"
  CARD_PRIORITY["$task_id"]="${priority:-medium}"
  ALL_TASKS+=("$task_id")
done < <(find "$KANBAN_DIR" -path "*/board/review/TASK-*.md" | sort)

if [ "${#ALL_TASKS[@]}" -eq 0 ]; then
  echo "PROJECT: ${SESSION_PROJECT:-none}"
  echo "---"
  echo "Nenhum card para revisao."
  exit 0
fi

for task_id in "${ALL_TASKS[@]}"; do
  if [ "${CARD_PROJECT[$task_id]}" = "$SESSION_PROJECT" ]; then
    PROJECT_TASKS+=("$task_id")
  fi
done

echo "PROJECT: $SESSION_PROJECT"
echo "---"

if [ "${#PROJECT_TASKS[@]}" -eq 0 ]; then
  echo "Nenhum card para revisao."
  exit 0
fi

sortable_lines=()
for task_id in "${PROJECT_TASKS[@]}"; do
  pri="${CARD_PRIORITY[$task_id]}"
  rank=$(rank_priority "$pri")
  num="${task_id#TASK-}"
  sortable_lines+=("$(printf '%d|%08d|%s|%s' "$rank" "$((10#$num))" "$task_id" "$pri")")
done

while IFS='|' read -r _ _ task_id pri; do
  echo "$task_id ($pri)"
done < <(printf '%s\n' "${sortable_lines[@]}" | sort -t'|' -k1,1n -k2,2n)

OTHER_COUNT=0
for task_id in "${!CARD_PROJECT[@]}"; do
  [ "${CARD_PROJECT[$task_id]}" = "$SESSION_PROJECT" ] || OTHER_COUNT=$((OTHER_COUNT + 1))
done

if [ "$OTHER_COUNT" -gt 0 ]; then
  echo "---"
  echo "IGNORADOS: $OTHER_COUNT card(s) de outro(s) projeto(s)."
fi
