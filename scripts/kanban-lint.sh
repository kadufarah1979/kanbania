#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
cd "$ROOT_DIR"

errors=0
strict="${KANBAN_LINT_STRICT:-0}"
include_done="${KANBAN_LINT_INCLUDE_DONE:-0}"

declare -a ids=()

if [ "$include_done" = "1" ]; then
  mapfile -t task_files < <(find board -type f -name 'TASK-*.md' | sort)
else
  mapfile -t task_files < <(
    find board/backlog board/todo board/in-progress board/review -type f -name 'TASK-*.md' 2>/dev/null | sort
  )
fi

if [ "${#task_files[@]}" -eq 0 ]; then
  echo "[WARN] Nenhum arquivo TASK-*.md encontrado em board/."
  exit 0
fi

required_keys=(id title project priority created_at created_by acted_by)
forbidden_keys=(points status)

for file in "${task_files[@]}"; do
  fm="$(sed -n '1,/^---$/p' "$file" | sed '1d;$d')"

  if [ -z "$fm" ]; then
    echo "[ERROR] $file: frontmatter ausente ou invalido"
    errors=$((errors + 1))
    continue
  fi

  for key in "${required_keys[@]}"; do
    if ! grep -Eq "^${key}:" <<<"$fm"; then
      echo "[ERROR] $file: campo obrigatorio ausente -> $key"
      errors=$((errors + 1))
    fi
  done

  for key in "${forbidden_keys[@]}"; do
    if grep -Eq "^${key}:" <<<"$fm"; then
      if [ "$strict" = "1" ]; then
        echo "[ERROR] $file: campo proibido encontrado -> $key"
        errors=$((errors + 1))
      else
        echo "[WARN] $file: campo legado detectado -> $key (use KANBAN_LINT_STRICT=1 para bloquear)"
      fi
    fi
  done

  id_value="$(grep -E '^id:' <<<"$fm" | head -n1 | sed -E 's/^id:[[:space:]]*//')"
  if [ -n "$id_value" ]; then
    ids+=("$id_value")
    expected="$(basename "$file" .md)"
    if [ "$id_value" != "$expected" ]; then
      echo "[ERROR] $file: id ($id_value) diferente do nome do arquivo ($expected)"
      errors=$((errors + 1))
    fi
  fi
done

if [ "${#ids[@]}" -gt 0 ]; then
  while IFS= read -r dup; do
    [ -z "$dup" ] && continue
    echo "[ERROR] ID duplicado: $dup"
    errors=$((errors + 1))
  done < <(printf '%s\n' "${ids[@]}" | sort | uniq -d)
fi

if [ "$errors" -gt 0 ]; then
  echo "\n[FAIL] kanban-lint encontrou $errors erro(s)."
  exit 1
fi

echo "[OK] kanban-lint passou sem erros."
