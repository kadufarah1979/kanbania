"""
Hook Stop — executado quando o agente para/interrompe.
Protegido contra loop recursivo via variavel de ambiente STOP_HOOK_ACTIVE.
"""
import json
import os
import sys

from _shared import send_hook_event


def main() -> None:
    if os.environ.get("STOP_HOOK_ACTIVE"):
        return

    os.environ["STOP_HOOK_ACTIVE"] = "1"

    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    reason = data.get("reason", data.get("stop_reason", ""))
    send_hook_event("Stop", {"reason": reason})


if __name__ == "__main__":
    main()
    sys.exit(0)
