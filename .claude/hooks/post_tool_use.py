"""
Hook PostToolUse — executado apos cada chamada de ferramenta.

Quando detecta um comando Bash que move um card para board/review/,
aciona automaticamente o trigger-agent-review.sh para iniciar o QA
do codex naquele card.
"""
import json
import os
import re
import subprocess
import sys

from _shared import send_hook_event

KANBAN_ROOT = os.environ.get("KANBAN_ROOT", os.path.expanduser("~/kanbania-fresh"))
TRIGGER_SCRIPT = os.path.join(KANBAN_ROOT, "scripts", "trigger-agent-review.sh")


def _maybe_trigger_review(tool_name: str, tool_input: dict) -> None:
    """Detecta mv para board/review/ e dispara o trigger do codex."""
    if tool_name != "Bash":
        return

    command = tool_input.get("command", "")
    if not command:
        return

    # Verifica se é um mv para board/review/
    if "board/review/" not in command:
        return

    # Extrai TASK-ID do comando (ex: mv .../TASK-0669.md .../board/review/TASK-0669.md)
    match = re.search(r"(TASK-\d+)", command)
    if not match:
        return

    task_id = match.group(1)

    if not os.path.isfile(TRIGGER_SCRIPT):
        return

    try:
        # Executa em background para nao bloquear o hook
        subprocess.Popen(
            ["bash", TRIGGER_SCRIPT, task_id],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception:
        pass


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    send_hook_event("PostToolUse", {
        "tool_name": tool_name,
        "tool_input": tool_input,
        "tool_response": data.get("tool_response", {}),
    })

    _maybe_trigger_review(tool_name, tool_input)


if __name__ == "__main__":
    main()
    sys.exit(0)
