"""
Hook SessionStart — executado ao iniciar uma sessao do agente.
Gera UUID de sessao e persiste em /tmp para uso pelos demais hooks.
"""
import os
import sys
import uuid

from _shared import send_hook_event


def main() -> None:
    ppid = os.getppid()
    session_id = str(uuid.uuid4())
    session_file = f"/tmp/claude-session-{ppid}.id"
    try:
        with open(session_file, "w") as f:
            f.write(session_id)
    except Exception:
        pass

    send_hook_event("SessionStart", {"ppid": ppid})


if __name__ == "__main__":
    main()
    sys.exit(0)
