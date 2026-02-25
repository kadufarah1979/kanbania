#!/usr/bin/env bash
# install.sh — Instala os services do kanbania como systemd user units.
# Uso: bash systemd/install.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$HOME/.config/systemd/user"

mkdir -p "$TARGET_DIR"

for svc in kb-claude-code.service kb-codex.service; do
  ln -sf "$SCRIPT_DIR/$svc" "$TARGET_DIR/$svc"
  echo "Linked $svc -> $TARGET_DIR/$svc"
done

systemctl --user daemon-reload
echo "daemon-reload done"

for svc in kb-claude-code kb-codex; do
  systemctl --user enable --now "$svc"
  echo "Enabled and started $svc"
done

echo "Done. Use 'systemctl --user status kb-claude-code kb-codex' to check."
