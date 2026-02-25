#!/usr/bin/env bash
# generate-task-instructions.sh — Generates self-contained instruction MDs from kanban cards.
# Usage: generate-task-instructions.sh [TASK-ID]
#   No args: generates for all backlog + in-progress + review tasks
#   With arg: generates only for the specified task

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPTS_DIR/lib/config.sh"

BOARD_DIR="$KANBAN_ROOT/board"
OUTPUT_DIR="$KANBAN_ROOT/tasks-instructions"

# Resolve reviewer agent worktree (optional — for prompt context)
REVIEWER_AGENT="$(get_reviewers | head -1)"

mkdir -p "$OUTPUT_DIR"

# ── Helpers ───────────────────────────────────────────────────────────────────

get_dep_status() {
  local dep="$1"
  if   [ -f "$BOARD_DIR/done/$dep.md" ];        then echo "done"
  elif [ -f "$BOARD_DIR/review/$dep.md" ];       then echo "review"
  elif [ -f "$BOARD_DIR/in-progress/$dep.md" ];  then echo "in-progress"
  elif [ -f "$BOARD_DIR/backlog/$dep.md" ];      then echo "backlog"
  else                                                echo "unknown"
  fi
}

get_field() {
  local file="$1" field="$2"
  grep "^${field}:" "$file" | head -1 | sed "s/^${field}: *//;s/^\"//;s/\"$//"
}

get_deps() {
  local file="$1"
  grep '^depends_on:' "$file" | sed 's/^depends_on: *\[//;s/\]//;s/,/ /g;s/^ *//'
}

get_section() {
  local file="$1" section_header="$2"
  sed -n "/^## ${section_header}/,/^## /{ /^## ${section_header}/d; /^## /d; p; }" "$file"
}

find_card() {
  local task_id="$1" col
  for col in in-progress review backlog done; do
    if [ -f "$BOARD_DIR/$col/$task_id.md" ]; then
      echo "$BOARD_DIR/$col/$task_id.md"
      return 0
    fi
  done
  return 1
}

# ── Generate one instruction file ─────────────────────────────────────────────

generate_one() {
  local task_id="$1"
  local card_file
  card_file=$(find_card "$task_id") || { echo "WARN: Card not found for $task_id"; return 1; }

  local title priority sprint labels project
  title=$(get_field "$card_file" "title")
  priority=$(get_field "$card_file" "priority")
  sprint=$(get_field "$card_file" "sprint")
  labels=$(get_field "$card_file" "labels")
  project=$(get_field "$card_file" "project")

  # Build dependency section
  local deps_text="" deps dep status
  deps=$(get_deps "$card_file")
  if [ -n "$deps" ]; then
    for dep in $deps; do
      status=$(get_dep_status "$dep")
      deps_text="${deps_text}- ${dep}: ${status}\n"
    done
  else
    deps_text="None\n"
  fi

  # Read full card content
  local card_content
  card_content=$(cat "$card_file")

  # Technical context section
  local tech_ctx
  tech_ctx=$(get_section "$card_file" "Technical Context" || get_section "$card_file" "Contexto.*Técnico" || echo "")

  # Resolve reviewers
  local reviewer_list
  reviewer_list="$(get_reviewers | paste -sd ',' | sed 's/,/, /g')"

  # Determine scope hint from labels
  local scope_hint
  case "$labels" in
    *feature*) scope_hint="feat" ;;
    *testing*) scope_hint="test" ;;
    *infra*)   scope_hint="infra" ;;
    *ux*)      scope_hint="feat" ;;
    *)         scope_hint="chore" ;;
  esac

  # Determine commit scope from title
  local commit_scope
  commit_scope=$(echo "$title" | tr '[:upper:]' '[:lower:]' \
    | sed 's/^"//;s/"$//' \
    | sed 's/implement //;s/create //;s/configure //;s/setup //;s/refactor //;s/add //' \
    | sed 's/ + /\n/;s/ with /\n/;s/ for /\n/;s/ based /\n/;s/ (.*//;s/ the /\n/' \
    | head -1 \
    | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g;s/^-//;s/-$//' | head -c 20)

  cat > "$OUTPUT_DIR/$task_id.md" <<ENDOFMD
# ${task_id}: ${title}

Do NOT read CLAUDE.md, AGENTS.md, config.yaml, or sprints/. Everything needed is here.

## Card

\`\`\`yaml+markdown
${card_content}
\`\`\`

## Dependencies

$(echo -e "$deps_text")
${tech_ctx:+
## Technical Context

${tech_ctx}
}
## Workflow

1. If NOT in in-progress: mv backlog/ -> in-progress/, acted_by: claimed
2. Implement according to acceptance criteria
3. Commit: \`${scope_hint}(${commit_scope}): description - ${task_id}\`
4. Add progress note to card
5. mv in-progress/ -> review/, set review_requested_from: [${reviewer_list}]
6. Log: \`{"timestamp":"ISO","agent":"${REVIEWER_AGENT:-reviewer}","action":"...","entity_type":"task","entity_id":"${task_id}","details":"...","project":"${project}"}\`
7. Kanban commit: \`[KANBAN] <action> ${task_id}: <description>\`

If already in in-progress, go directly to step 2.
ENDOFMD

  echo "Generated: $OUTPUT_DIR/$task_id.md"
}

# ── Main ──────────────────────────────────────────────────────────────────────

if [ $# -gt 0 ]; then
  generate_one "$1"
else
  for dir in backlog in-progress review; do
    for card in "$BOARD_DIR/$dir"/*.md; do
      [ -f "$card" ] || continue
      task_id=$(basename "$card" .md)
      generate_one "$task_id"
    done
  done
  echo "Done. Generated instruction files in $OUTPUT_DIR/"
fi
