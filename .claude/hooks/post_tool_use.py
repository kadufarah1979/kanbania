"""
Hook PostToolUse — executado apos cada chamada de ferramenta.
"""
import json
import sys

from _shared import send_hook_event


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    tool_name = data.get("tool_name", "")
    send_hook_event("PostToolUse", {
        "tool_name": tool_name,
        "tool_input": data.get("tool_input", {}),
        "tool_response": data.get("tool_response", {}),
    })


if __name__ == "__main__":
    main()
    sys.exit(0)
