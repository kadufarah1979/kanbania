"""
Modulo utilitario compartilhado para hooks Claude Code.
Envia eventos ao server.ts via HTTP POST.
"""
import json
import os
import urllib.request
from datetime import datetime, timezone


def _get_session_id() -> str:
    ppid = os.getppid()
    session_file = f"/tmp/claude-session-{ppid}.id"
    try:
        with open(session_file, "r") as f:
            return f.read().strip()
    except Exception:
        return ""


def send_hook_event(hook_type: str, payload: dict) -> None:
    """
    Envia um evento de hook ao server.ts.
    Falha silenciosa — excecoes nao propagam.
    """
    try:
        server_url = os.environ.get("HOOK_SERVER_URL", "http://localhost:8766")
        agent_id = os.environ.get("CLAUDE_AGENT_ID", "claude-code")
        session_id = _get_session_id()
        source_app = (
            os.environ.get("CLAUDE_SOURCE_APP")
            or os.path.basename(os.environ.get("KANBAN_ROOT", "").rstrip("/"))
            or os.path.basename(os.getcwd())
            or "unknown"
        )

        body = {
            "agent_id": agent_id,
            "session_id": session_id,
            "hook_type": hook_type,
            "source_app": source_app,
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
