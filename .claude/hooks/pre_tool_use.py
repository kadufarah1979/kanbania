"""
Hook PreToolUse — executado antes de cada chamada de ferramenta.
"""
import json
import sys

from _shared import send_hook_event


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    send_hook_event("PreToolUse", {
        "tool_name": data.get("tool_name", ""),
        "tool_input": data.get("tool_input", {}),
    })


if __name__ == "__main__":
    main()
    sys.exit(0)
