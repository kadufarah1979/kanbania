#!/usr/bin/env bash
# codex-qa-session.sh — Sessao de QA isolada por projeto
#
# Cria worktree temporaria, executa review de cards de um unico projeto,
# e limpa ao final. O working tree principal nunca e tocado.
#
# Uso:
#   codex-qa-session.sh <projeto>
#
# Exemplo:
#   codex-qa-session.sh aquario
#   codex-qa-session.sh kanbania
#
# Saida:
#   WORKTREE: /tmp/kanbania-codex-<projeto>
#   BRANCH: codex-qa-<projeto>
#   PROJECT: <projeto>
#   QUEUE:
#     TASK-XXXX (priority)
#     ...
#
# O codex deve operar EXCLUSIVAMENTE dentro da worktree retornada.
# Ao final, chamar: codex-qa-session.sh --cleanup <projeto>

set -euo pipefail

source "$(dirname "$0")/lib/config.sh"
KANBAN_DIR="${KANBAN_ROOT}"
SCRIPTS_DIR="${KANBAN_ROOT}/scripts"

ACTION="${1:-}"
PROJECT="${2:-$ACTION}"

# --- Cleanup mode ---
if [ "$ACTION" = "--cleanup" ]; then
  if [ -z "${2:-}" ]; then
    echo "ERRO: uso: codex-qa-session.sh --cleanup <projeto>" >&2
    exit 1
  fi
  PROJECT="$2"
  WT_DIR="/tmp/kanbania-codex-$PROJECT"

  if [ -d "$WT_DIR" ]; then
    # Sync main com as alteracoes da worktree (pull)
    git -C "$KANBAN_DIR" pull --rebase --autostash origin main 2>/dev/null || true
    git -C "$KANBAN_DIR" worktree remove "$WT_DIR" --force 2>/dev/null || true
    git -C "$KANBAN_DIR" branch -D "codex-qa-$PROJECT" 2>/dev/null || true
    echo "CLEANUP: worktree $WT_DIR removida."
  else
    echo "CLEANUP: worktree $WT_DIR nao existe, nada a fazer."
  fi
  exit 0
fi

# --- Validacao ---
if [ -z "$PROJECT" ] || [ "$PROJECT" = "--cleanup" ]; then
  echo "ERRO: projeto obrigatorio." >&2
  echo "Uso: codex-qa-session.sh <projeto>" >&2
  echo "Uso: codex-qa-session.sh --cleanup <projeto>" >&2
  exit 1
fi

# --- Sync main antes de criar worktree ---
git -C "$KANBAN_DIR" fetch origin main 2>/dev/null || true
git -C "$KANBAN_DIR" pull --rebase --autostash origin main 2>/dev/null || true

# --- Criar worktree isolada ---
WT_DIR="/tmp/kanbania-codex-$PROJECT"
WT_BRANCH="codex-qa-$PROJECT"

# Limpar worktree anterior se existir
if [ -d "$WT_DIR" ]; then
  git -C "$KANBAN_DIR" worktree remove "$WT_DIR" --force 2>/dev/null || true
  git -C "$KANBAN_DIR" branch -D "$WT_BRANCH" 2>/dev/null || true
fi

# Limpar branch orfao se existir
git -C "$KANBAN_DIR" branch -D "$WT_BRANCH" 2>/dev/null || true

# Criar worktree a partir de main
git -C "$KANBAN_DIR" worktree add -b "$WT_BRANCH" "$WT_DIR" origin/main 2>/dev/null

# --- Listar fila de review do projeto ---
QUEUE_OUTPUT=$(bash "$SCRIPTS_DIR/codex-review-queue.sh" "$PROJECT" 2>/dev/null || true)

# --- Output ---
echo "WORKTREE: $WT_DIR"
echo "BRANCH: $WT_BRANCH"
echo "$QUEUE_OUTPUT"
echo "---"
echo "INSTRUCOES:"
echo "  1. cd $WT_DIR"
echo "  2. Processar cards listados acima (1 por vez, commit+push apos cada)"
echo "  3. Push: git push origin $WT_BRANCH:main"
echo "  4. Ao final: codex-qa-session.sh --cleanup $PROJECT"
