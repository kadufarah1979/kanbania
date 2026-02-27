"""
kanban.py — Operacoes no sistema Kanbania

Responsabilidades:
- Determinar proximo ID de task (varrer board/ + archive/)
- Criar tasks no backlog (schema canonico AGENTS.md secao 3)
- Mover cards entre colunas
- Registrar em activity.jsonl
- Buscar sprint ativa do projeto
"""

import os
import re
import json
import glob as glob_module
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

AGENT_ID = "claude-code"
KANBANIA_PATH = os.environ.get("KANBANIA_PATH", "/home/carlosfarah/kanbania-fresh")

# Offset de Brasilia (UTC-3)
TZ_BR = timezone(timedelta(hours=-3))


def _now_iso() -> str:
    return datetime.now(TZ_BR).strftime("%Y-%m-%dT%H:%M:%S%z")


def _board_path(project: str) -> str:
    """
    Resolve o caminho do board conforme AGENTS.md secao 3.2.
    Para projetos simples (sem subproject), verifica projects/<proj>/board/ primeiro,
    depois board/ global.
    """
    proj_board = os.path.join(KANBANIA_PATH, "projects", project, "board")
    if os.path.isdir(proj_board):
        return proj_board
    return os.path.join(KANBANIA_PATH, "board")


def _sprints_path(project: str) -> str:
    proj_sprints = os.path.join(KANBANIA_PATH, "projects", project, "sprints")
    if os.path.isdir(proj_sprints):
        return proj_sprints
    return os.path.join(KANBANIA_PATH, "sprints")


def _activity_log_path() -> str:
    return os.path.join(KANBANIA_PATH, "logs", "activity.jsonl")


def log_activity(action: str, entity_id: str, details: str, project: str) -> None:
    """Registra entrada no activity.jsonl (append-only)."""
    entry = {
        "timestamp": _now_iso(),
        "agent": AGENT_ID,
        "action": action,
        "entity_type": "task",
        "entity_id": entity_id,
        "details": details,
        "project": project,
    }
    log_path = _activity_log_path()
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def get_next_task_id(project: str) -> str:
    """
    Determina o proximo ID de task varrendo board/ e archive/ do projeto.
    Retorna 'TASK-NNNN' com o proximo numero sequencial.
    """
    board = _board_path(project)
    patterns = [
        os.path.join(board, "**", "TASK-*.md"),
        os.path.join(KANBANIA_PATH, "archive", "**", "TASK-*.md"),
        os.path.join(KANBANIA_PATH, "board", "**", "TASK-*.md"),
    ]

    max_id = 0
    for pattern in patterns:
        for f in glob_module.glob(pattern, recursive=True):
            m = re.search(r"TASK-(\d+)\.md$", f)
            if m:
                max_id = max(max_id, int(m.group(1)))

    return f"TASK-{max_id + 1:04d}"


def get_active_sprint(project: str) -> Optional[str]:
    """
    Busca a sprint com status: active do projeto.
    Retorna o ID da sprint (ex: 'sprint-089') ou None.
    """
    sprints_dir = _sprints_path(project)
    if not os.path.isdir(sprints_dir):
        return None

    for fname in sorted(os.listdir(sprints_dir)):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(sprints_dir, fname)
        try:
            content = Path(fpath).read_text(encoding="utf-8")
            if "status: active" in content:
                m = re.search(r"^id:\s*(.+)$", content, re.MULTILINE)
                if m:
                    return m.group(1).strip().strip('"')
        except OSError:
            continue
    return None


def create_sprint(project: str, label: str) -> str:
    """
    Cria uma nova sprint dedicada. Retorna o ID da nova sprint.
    Label exemplo: 'Analise de Infra — prd 2026-02-27'
    """
    sprints_dir = _sprints_path(project)
    os.makedirs(sprints_dir, exist_ok=True)

    existing = [
        f for f in os.listdir(sprints_dir)
        if re.match(r"sprint-\d+\.md$", f)
    ]
    nums = [int(re.search(r"(\d+)", f).group(1)) for f in existing] if existing else [0]
    next_num = max(nums) + 1
    sprint_id = f"sprint-{next_num:03d}"

    today = datetime.now(TZ_BR).strftime("%Y-%m-%d")
    content = f"""---
id: {sprint_id}
project: {project}
title: "{label}"
status: active
created_at: "{_now_iso()}"
start_date: "{today}"
end_date: null
capacity_sp: 8
---

## Objetivo

{label}

## Tasks
"""
    sprint_file = os.path.join(sprints_dir, f"{sprint_id}.md")
    Path(sprint_file).write_text(content, encoding="utf-8")
    return sprint_id


def create_task(
    project: str,
    title: str,
    sprint: str,
    priority: str = "medium",
    labels: list[str] | None = None,
    story_points: int = 1,
    depends_on: list[str] | None = None,
    blocks: list[str] | None = None,
    description: str = "",
    task_id: str | None = None,
) -> str:
    """
    Cria uma task no backlog do projeto. Retorna o ID da task criada.
    Segue schema canonico (AGENTS.md secao 3).
    """
    if task_id is None:
        task_id = get_next_task_id(project)

    board = _board_path(project)
    backlog_dir = os.path.join(board, "backlog")
    os.makedirs(backlog_dir, exist_ok=True)

    now = _now_iso()
    labels_yaml = "\n".join(f"  - {l}" for l in (labels or []))
    depends_yaml = "\n".join(f"  - {d}" for d in (depends_on or []))
    blocks_yaml = "\n".join(f"  - {b}" for b in (blocks or []))

    content = f"""---
id: {task_id}
title: "{title}"
project: {project}
sprint: {sprint}
okr: null
priority: {priority}
labels:
{labels_yaml if labels_yaml else "  []"}
story_points: {story_points}
created_at: "{now}"
created_by: {AGENT_ID}
assigned_to: null
review_requested_from: []
depends_on:
{depends_yaml if depends_yaml else "  []"}
blocks:
{blocks_yaml if blocks_yaml else "  []"}
acted_by:
  - agent: {AGENT_ID}
    action: created
    date: "{now}"
---

## Descricao

{description}

## Criterios de Aceitacao

- [ ] Executado com sucesso
- [ ] Saida salva em docs/

## Progress Notes

"""
    task_file = os.path.join(backlog_dir, f"{task_id}.md")
    Path(task_file).write_text(content, encoding="utf-8")
    log_activity("create", task_id, title, project)
    return task_id


def move_task(task_id: str, project: str, target_column: str) -> None:
    """
    Move task para uma coluna do board.
    target_column: backlog | todo | in-progress | review | done
    """
    board = _board_path(project)
    columns = ["backlog", "todo", "in-progress", "review", "done"]
    source_file = None
    source_col = None

    for col in columns:
        candidate = os.path.join(board, col, f"{task_id}.md")
        if os.path.isfile(candidate):
            source_file = candidate
            source_col = col
            break

    if source_file is None:
        raise FileNotFoundError(f"{task_id} nao encontrado no board de {project}")

    target_dir = os.path.join(board, target_column)
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, f"{task_id}.md")

    # Atualiza acted_by no arquivo
    content = Path(source_file).read_text(encoding="utf-8")
    now = _now_iso()
    acted_entry = f"  - agent: {AGENT_ID}\n    action: move\n    date: \"{now}\""
    content = re.sub(
        r"(acted_by:\n(?:  - .*\n)*)",
        lambda m: m.group(0) + acted_entry + "\n",
        content,
    )

    Path(target_file).write_text(content, encoding="utf-8")
    os.remove(source_file)
    log_activity("move", task_id, f"{task_id} movida de {source_col} para {target_column}", project)


def claim_task(task_id: str, project: str) -> None:
    """Reclama task: atribui assigned_to e move para in-progress."""
    board = _board_path(project)
    columns = ["backlog", "todo"]
    task_file = None
    source_col = None

    for col in columns:
        candidate = os.path.join(board, col, f"{task_id}.md")
        if os.path.isfile(candidate):
            task_file = candidate
            source_col = col
            break

    if task_file is None:
        # Pode ja estar in-progress
        candidate = os.path.join(board, "in-progress", f"{task_id}.md")
        if os.path.isfile(candidate):
            return  # ja claimed
        raise FileNotFoundError(f"{task_id} nao encontrado em backlog/todo de {project}")

    content = Path(task_file).read_text(encoding="utf-8")
    content = re.sub(r"assigned_to: null", f"assigned_to: {AGENT_ID}", content)

    now = _now_iso()
    acted_entry = f"  - agent: {AGENT_ID}\n    action: claim\n    date: \"{now}\""
    content = re.sub(
        r"(acted_by:\n(?:  - .*\n)*)",
        lambda m: m.group(0) + acted_entry + "\n",
        content,
    )

    in_progress_dir = os.path.join(board, "in-progress")
    os.makedirs(in_progress_dir, exist_ok=True)
    target_file = os.path.join(in_progress_dir, f"{task_id}.md")
    Path(target_file).write_text(content, encoding="utf-8")
    os.remove(task_file)
    log_activity("claim", task_id, f"{task_id} claimed por {AGENT_ID}", project)


def complete_task(task_id: str, project: str, note: str = "") -> None:
    """Auto-aprova task (1-2 SP, docs/infra) e move para done."""
    if note:
        board = _board_path(project)
        in_prog = os.path.join(board, "in-progress", f"{task_id}.md")
        if os.path.isfile(in_prog):
            content = Path(in_prog).read_text(encoding="utf-8")
            content = content.rstrip() + f"\n\n**{_now_iso()}** — {note}\n"
            Path(in_prog).write_text(content, encoding="utf-8")

    move_task(task_id, project, "done")
    log_activity("complete", task_id, note or f"{task_id} concluida", project)
