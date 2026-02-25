#!/usr/bin/env bash
# kanban-lint.sh — Validate task files against the kanban schema.
# Usage: kanban-lint.sh [root-dir]
set -euo pipefail

ROOT_DIR="${1:-.}"
cd "$ROOT_DIR"

# Load config to get column list dynamically
source "$(dirname "${BASH_SOURCE[0]}")/lib/config.sh"

errors=0
strict="${KANBAN_LINT_STRICT:-0}"
include_done="${KANBAN_LINT_INCLUDE_DONE:-0}"

declare -a ids=()

# Build the list of board directories from config columns
mapfile -t _columns < <(get_columns)

if [ "$include_done" = "1" ]; then
  mapfile -t task_files < <(find board -type f -name 'TASK-*.md' | sort)
else
  # Scan all non-done columns
  declare -a _search_dirs=()
  for _col in "${_columns[@]}"; do
    [ "$_col" = "done" ] && continue
    _dir="board/${_col}"
    [ -d "$_dir" ] && _search_dirs+=("$_dir")
  done
  if [ "${#_search_dirs[@]}" -gt 0 ]; then
    mapfile -t task_files < <(find "${_search_dirs[@]}" -type f -name 'TASK-*.md' 2>/dev/null | sort)
  else
    task_files=()
  fi
fi

if [ "${#task_files[@]}" -eq 0 ]; then
  echo "[WARN] No TASK-*.md files found in board/."
  exit 0
fi

required_keys=(id title project priority created_at created_by acted_by)
forbidden_keys=(points status)

for file in "${task_files[@]}"; do
  fm="$(sed -n '1,/^---$/p' "$file" | sed '1d;$d')"

  if [ -z "$fm" ]; then
    echo "[ERROR] $file: frontmatter missing or invalid"
    errors=$((errors + 1))
    continue
  fi

  for key in "${required_keys[@]}"; do
    if ! grep -Eq "^${key}:" <<<"$fm"; then
      echo "[ERROR] $file: required field missing -> $key"
      errors=$((errors + 1))
    fi
  done

  for key in "${forbidden_keys[@]}"; do
    if grep -Eq "^${key}:" <<<"$fm"; then
      if [ "$strict" = "1" ]; then
        echo "[ERROR] $file: forbidden field found -> $key"
        errors=$((errors + 1))
      else
        echo "[WARN] $file: legacy field detected -> $key (use KANBAN_LINT_STRICT=1 to enforce)"
      fi
    fi
  done

  id_value="$(grep -E '^id:' <<<"$fm" | head -n1 | sed -E 's/^id:[[:space:]]*//')"
  if [ -n "$id_value" ]; then
    ids+=("$id_value")
    expected="$(basename "$file" .md)"
    if [ "$id_value" != "$expected" ]; then
      echo "[ERROR] $file: id ($id_value) does not match filename ($expected)"
      errors=$((errors + 1))
    fi
  fi
done

if [ "${#ids[@]}" -gt 0 ]; then
  while IFS= read -r dup; do
    [ -z "$dup" ] && continue
    echo "[ERROR] Duplicate ID: $dup"
    errors=$((errors + 1))
  done < <(printf '%s\n' "${ids[@]}" | sort | uniq -d)
fi

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "[FAIL] kanban-lint found $errors error(s)."
  exit 1
fi

echo "[OK] kanban-lint passed with no errors."
