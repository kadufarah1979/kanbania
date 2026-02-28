"""
Hook SessionEnd — executado ao encerrar uma sessao do agente.
Remove o arquivo de sessao e envia evento.
"""
import os
import sys

from _shared import send_hook_event


def main() -> None:
    ppid = os.getppid()
    session_file = f"/tmp/claude-session-{ppid}.id"
    send_hook_event("SessionEnd", {})

    try:
        os.remove(session_file)
    except Exception:
        pass


if __name__ == "__main__":
    main()
    sys.exit(0)
