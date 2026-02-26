#!/usr/bin/env bash
# install-git-hooks.sh — Instala os git hooks do Kanbania em .git/hooks/

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$ROOT/scripts/git-hooks"
HOOKS_DEST="$ROOT/.git/hooks"

if [ ! -d "$HOOKS_DEST" ]; then
  echo "Erro: .git/hooks nao encontrado. Execute a partir da raiz do repositorio."
  exit 1
fi

installed=0

for hook in "$HOOKS_SRC"/*; do
  name="$(basename "$hook")"
  dest="$HOOKS_DEST/$name"

  if [ -f "$dest" ] && [ ! -L "$dest" ]; then
    echo "Aviso: hook existente encontrado em $dest — fazendo backup em $dest.bak"
    cp "$dest" "$dest.bak"
  fi

  cp "$hook" "$dest"
  chmod +x "$dest"
  echo "Instalado: $dest"
  ((installed++))
done

echo ""
echo "$installed hook(s) instalado(s) com sucesso."
echo ""
echo "Proximos passos:"
echo "  1. Adicione suas credenciais do X em config.local.yaml (veja o exemplo abaixo)"
echo "  2. Habilite a integracao em config.yaml (x_integration.enabled: true)"
echo ""
echo "Exemplo config.local.yaml:"
echo "  x_integration:"
echo "    api_key: SEU_API_KEY"
echo "    api_secret: SEU_API_SECRET"
echo "    access_token: SEU_ACCESS_TOKEN"
echo "    access_token_secret: SEU_ACCESS_TOKEN_SECRET"
