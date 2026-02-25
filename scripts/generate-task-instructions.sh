#!/usr/bin/env bash
# Generates self-contained instruction MDs for Codex from kanban cards.
# Usage: generate-task-instructions.sh [TASK-ID]
#   No args: generates for all backlog + in-progress + review tasks
#   With arg: generates only for the specified task

set -euo pipefail

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
OUTPUT_DIR="$KANBAN_DIR/tasks-instructions"
PROJECT_DIR="/home/carlosfarah/Projects/aquario-codex"  # Codex worktree

mkdir -p "$OUTPUT_DIR"

# Resolve dependency status
get_dep_status() {
  local dep="$1"
  if [ -f "$BOARD_DIR/done/$dep.md" ]; then
    echo "done"
  elif [ -f "$BOARD_DIR/review/$dep.md" ]; then
    echo "review"
  elif [ -f "$BOARD_DIR/in-progress/$dep.md" ]; then
    echo "in-progress"
  elif [ -f "$BOARD_DIR/backlog/$dep.md" ]; then
    echo "backlog"
  else
    echo "unknown"
  fi
}

# Extract YAML frontmatter field (simple single-line)
get_field() {
  local file="$1" field="$2"
  grep "^${field}:" "$file" | head -1 | sed "s/^${field}: *//;s/^\"//;s/\"$//"
}

# Extract depends_on as space-separated list
get_deps() {
  local file="$1"
  grep '^depends_on:' "$file" | sed 's/^depends_on: *\[//;s/\]//;s/,/ /g;s/^ *//'
}

# Extract technical context section from card
get_technical_context() {
  local file="$1"
  sed -n '/^## Contexto Técnico/,/^## /{/^## Contexto Técnico/d;/^## /d;p}' "$file" | sed '/^$/d'
}

# Extract acceptance criteria from card
get_acceptance_criteria() {
  local file="$1"
  sed -n '/^## Critérios de Aceite/,/^## /{/^## Critérios de Aceite/d;/^## /d;p}' "$file"
}

# Extract description from card
get_description() {
  local file="$1"
  sed -n '/^## Descrição/,/^## /{/^## Descrição/d;/^## /d;p}' "$file"
}

# Determine card location
find_card() {
  local task_id="$1"
  for dir in in-progress review backlog done; do
    if [ -f "$BOARD_DIR/$dir/$task_id.md" ]; then
      echo "$BOARD_DIR/$dir/$task_id.md"
      return 0
    fi
  done
  return 1
}

# Generate instruction MD for a single task
generate_one() {
  local task_id="$1"
  local card_file
  card_file=$(find_card "$task_id") || { echo "WARN: Card not found for $task_id"; return 1; }

  local title priority sprint labels
  title=$(get_field "$card_file" "title")
  priority=$(get_field "$card_file" "priority")
  sprint=$(get_field "$card_file" "sprint")
  labels=$(get_field "$card_file" "labels")

  # Build dependency section
  local deps_text=""
  local deps
  deps=$(get_deps "$card_file")
  if [ -n "$deps" ]; then
    for dep in $deps; do
      local status
      status=$(get_dep_status "$dep")
      deps_text="${deps_text}- ${dep}: ${status}\n"
    done
  else
    deps_text="Nenhuma\n"
  fi

  # Read full card content
  local card_content
  card_content=$(cat "$card_file")

  # Build technical context
  local tech_ctx
  tech_ctx=$(get_technical_context "$card_file")

  # Determine scope hint from labels
  local scope_hint=""
  case "$labels" in
    *feature*) scope_hint="feat" ;;
    *testing*) scope_hint="test" ;;
    *infra*) scope_hint="infra" ;;
    *ux*) scope_hint="feat" ;;
    *) scope_hint="chore" ;;
  esac

  # Determine commit scope from title - extract key noun/module
  local commit_scope
  commit_scope=$(echo "$title" | tr '[:upper:]' '[:lower:]' \
    | sed 's/^"//;s/"$//' \
    | sed 's/implementar //;s/criar //;s/configurar //;s/setup //;s/recriar //;s/integrar //' \
    | sed 's/ + /\n/;s/ com /\n/;s/ para /\n/;s/ baseado /\n/;s/ (.*//;s/ no /\n/;s/ de /\n/;s/ do /\n/' \
    | head -1 \
    | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g;s/^-//;s/-$//' | head -c 20)

  cat > "$OUTPUT_DIR/$task_id.md" <<ENDOFMD
# ${task_id}: ${title}

NAO leia CODEX.md, AGENTS.md, config.yaml, sprints/. TUDO que precisa esta aqui.

## Card

\`\`\`yaml+markdown
${card_content}
\`\`\`

## Dependencias

$(echo -e "$deps_text")
${tech_ctx:+
## Contexto Tecnico

${tech_ctx}
}
## Workflow

1. Se NAO em in-progress: mv backlog/ -> in-progress/, acted_by: claimed
2. Implementar conforme criterios de aceite
3. Commit: \`${scope_hint}(${commit_scope}): descricao - ${task_id}\`
4. Nota de progresso no card
5. mv in-progress/ -> review/, setar review_requested_from: [claude-code]
6. Log: \`{"timestamp":"ISO","agent":"codex","action":"...","entity_type":"task","entity_id":"${task_id}","details":"...","project":"aquario"}\`
7. Commit kanban: \`[KANBAN] <action> ${task_id}: <descricao>\`

Se ja em in-progress, va direto ao passo 2.
ENDOFMD

  echo "Generated: $OUTPUT_DIR/$task_id.md"
}

# Main
if [ $# -gt 0 ]; then
  generate_one "$1"
else
  # Generate for all non-done tasks
  for dir in backlog in-progress review; do
    for card in "$BOARD_DIR/$dir"/*.md; do
      [ -f "$card" ] || continue
      task_id=$(basename "$card" .md)
      generate_one "$task_id"
    done
  done
  echo "Done. Generated instruction files in $OUTPUT_DIR/"
fi
