import json
import sys

from _shared import send_hook_event


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    send_hook_event("SubagentStart", {
        "subagent_type": data.get("subagent_type", ""),
        "description": data.get("description", ""),
    })


if __name__ == "__main__":
    main()
    sys.exit(0)
