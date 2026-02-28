"""
Hook notify do Codex CLI — disparado em agent-turn-complete.
Envia evento ao WS server (server.ts) via POST /events/hook.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone


def send_hook_event(hook_type: str, payload: dict) -> None:
    try:
        server_url = os.environ.get("HOOK_SERVER_URL", "http://localhost:8766")
        body = {
            "agent_id": "codex",
            "session_id": payload.get("thread-id", ""),
            "hook_type": hook_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{server_url}/events/hook",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=2):
            pass
    except Exception:
        pass


def main() -> int:
    try:
        notification = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    except Exception:
        return 0

    event_type = notification.get("type", "")

    if event_type == "agent-turn-complete":
        send_hook_event("Stop", {
            "thread-id": notification.get("thread-id", ""),
            "turn-id": notification.get("turn-id", ""),
            "cwd": notification.get("cwd", ""),
            "last_message": notification.get("last-assistant-message", ""),
        })

    return 0


if __name__ == "__main__":
    sys.exit(main())
