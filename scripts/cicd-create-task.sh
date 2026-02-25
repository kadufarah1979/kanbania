#!/usr/bin/env bash
# cicd-create-task.sh — Create a kanban task from a CI/CD pipeline failure
#
# Usage: cicd-create-task.sh <pipeline_id> <job_name> <error_category> <error_summary> <pipeline_url> <commit_sha> <project_name> [error_context]
# Creates TASK in board/in-progress/ with priority critical and label cicd-fix.

set -euo pipefail

PIPELINE_ID="${1:?Usage: cicd-create-task.sh <pipeline_id> <job_name> <error_category> <error_summary> <pipeline_url> <commit_sha> <project_name> [error_context]}"
JOB_NAME="${2:?missing job_name}"
ERROR_CATEGORY="${3:?missing error_category}"
ERROR_SUMMARY="${4:?missing error_summary}"
PIPELINE_URL="${5:?missing pipeline_url}"
COMMIT_SHA="${6:?missing commit_sha}"
PROJECT_NAME="${7:?missing project_name}"
ERROR_CONTEXT="${8:-}"

KANBAN_DIR="/home/carlosfarah/kanbania"
BOARD_DIR="$KANBAN_DIR/board"
ARCHIVE_DIR="$KANBAN_DIR/archive"
LOGS_DIR="$KANBAN_DIR/logs"
LOCK_DIR="/tmp/kb-locks"
GLOBAL_LOCK_FILE="$LOCK_DIR/board-global.lock"

mkdir -p "$LOCK_DIR"

now() { date -Iseconds | sed 's/+00:00$/-03:00/'; }

# ── Acquire lock (same pattern as kb.sh) ────────────────────────────────────

exec 9>"$GLOBAL_LOCK_FILE"
flock -w 30 9 || { echo "ERROR: could not acquire board lock" >&2; exit 1; }

# ── Generate next TASK-ID ───────────────────────────────────────────────────

max_id=0
while IFS= read -r f; do
  num=$(basename "$f" .md | sed 's/TASK-//')
  num=$((10#$num))
  [ "$num" -gt "$max_id" ] && max_id="$num"
done < <(find "$BOARD_DIR" "$ARCHIVE_DIR" -name 'TASK-*.md' -type f 2>/dev/null)

next_id=$((max_id + 1))
task_id=$(printf "TASK-%04d" "$next_id")

# ── Read active sprint ──────────────────────────────────────────────────────

sprint="null"
current_file="$KANBAN_DIR/sprints/current.md"
if [ -f "$current_file" ]; then
  sprint_match=$(grep -oP 'sprint-\d+' "$current_file" | head -1 || true)
  [ -n "$sprint_match" ] && sprint="$sprint_match"
fi

# ── Map error_category to human-readable title ─────────────────────────────

case "$ERROR_CATEGORY" in
  build_error)      title_suffix="erro de build no pipeline" ;;
  migration_error)  title_suffix="erro de migration no pipeline" ;;
  deploy_failure)   title_suffix="falha de deploy no pipeline" ;;
  test_failure)     title_suffix="falha de testes no pipeline" ;;
  *)                title_suffix="falha no pipeline CI/CD" ;;
esac

title="[CI/CD] Corrigir $title_suffix (#$PIPELINE_ID)"
timestamp=$(now)

# ── Create task file ────────────────────────────────────────────────────────

task_file="$BOARD_DIR/in-progress/$task_id.md"

cat > "$task_file" <<FRONTMATTER
---
id: $task_id
title: "$title"
project: $PROJECT_NAME
sprint: $sprint
okr: null
priority: critical
labels: [cicd-fix, automated]
story_points: 3
created_at: "$timestamp"
created_by: cicd-webhook
assigned_to: claude-code
review_requested_from: [codex]
depends_on: []
blocks: []
cicd_pipeline_id: $PIPELINE_ID
cicd_pipeline_url: "$PIPELINE_URL"
cicd_commit_sha: "$COMMIT_SHA"
cicd_error_category: "$ERROR_CATEGORY"
acted_by:
  - agent: cicd-webhook
    action: created
    date: "$timestamp"
  - agent: cicd-webhook
    action: claimed
    date: "$timestamp"
---

## Descricao

O pipeline CI/CD do projeto $PROJECT_NAME falhou. O agente deve analisar o erro, corrigir o codigo e fazer push para main.

- **Pipeline**: [#$PIPELINE_ID]($PIPELINE_URL)
- **Job**: $JOB_NAME
- **Categoria**: $ERROR_CATEGORY
- **Commit**: \`$COMMIT_SHA\`

## Erro Detectado

\`\`\`
$ERROR_SUMMARY
\`\`\`

FRONTMATTER

# Append error context if provided
if [ -n "$ERROR_CONTEXT" ]; then
  cat >> "$task_file" <<CONTEXT

## Log de Erro (contexto)

\`\`\`
$ERROR_CONTEXT
\`\`\`

CONTEXT
fi

cat >> "$task_file" <<CRITERIA

## Criterios de Aceite

- [ ] Causa raiz identificada
- [ ] Correcao implementada e commitada em main
- [ ] Pipeline re-executado com sucesso (automatico apos aprovacao codex)

CRITERIA

# ── Log to activity.jsonl ───────────────────────────────────────────────────

activity_file="$LOGS_DIR/activity.jsonl"
log_entry=$(cat <<EOF
{"timestamp":"$timestamp","agent":"cicd-webhook","action":"cicd_task_created","entity_type":"task","entity_id":"$task_id","project":"$PROJECT_NAME","details":"Pipeline #$PIPELINE_ID falhou ($ERROR_CATEGORY) no job $JOB_NAME, commit $COMMIT_SHA"}
EOF
)
echo "$log_entry" >> "$activity_file"

# ── Git commit + push ───────────────────────────────────────────────────────

cd "$KANBAN_DIR"
git add "$task_file" "$activity_file"
git commit -m "[KANBAN] cicd-create $task_id: $title_suffix pipeline #$PIPELINE_ID

Agent: cicd-webhook"
git push origin main

# ── Release lock ────────────────────────────────────────────────────────────

flock -u 9

echo "$task_id"
