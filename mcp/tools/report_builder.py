"""
report_builder.py — Montagem de markdown estruturado por fase

Utilitario para consolidar e organizar os .md gerados pelas fases.
Nao gera conteudo novo — apenas estrutura e lista os arquivos para o PDF.
"""

import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

TZ_BR = timezone(timedelta(hours=-3))

PHASE_FILE_MAP = {
    "inventario": "inventario.md",
    "cloudwatch": "metricas-cloudwatch.md",
    "ssm": "diagnostico-ssm.md",
    "analise": "analise-consolidada.md",
}

PHASE_LABELS = {
    "inventario": "Fase 1 · Inventario",
    "cloudwatch": "Fase 2 · Metricas CloudWatch",
    "ssm": "Fase 3 · Diagnostico SSM",
    "analise": "Fase 4 · Analise Consolidada",
}


def list_generated_files(docs_dir: str) -> list[str]:
    """Lista os arquivos .md gerados em ordem de fase."""
    result = []
    for phase, fname in PHASE_FILE_MAP.items():
        fpath = os.path.join(docs_dir, fname)
        if os.path.isfile(fpath):
            result.append(fpath)
    return result


def get_phase_labels(docs_dir: str, task_ids: list[str] | None = None) -> list[str]:
    """Retorna labels para cada fase presente no docs_dir."""
    labels = []
    task_idx = 0
    for phase, fname in PHASE_FILE_MAP.items():
        fpath = os.path.join(docs_dir, fname)
        if os.path.isfile(fpath):
            base_label = PHASE_LABELS[phase]
            if task_ids and task_idx < len(task_ids):
                label = f"{base_label} · {task_ids[task_idx]}"
            else:
                label = base_label
            labels.append(label)
            task_idx += 1
    return labels


def build_summary_index(docs_dir: str, environment: str, task_ids: list[str] | None = None) -> str:
    """
    Gera um indice markdown dos arquivos criados (para referencia).
    Nao e incluido no PDF — apenas para debug/historico.
    """
    now = datetime.now(TZ_BR)
    lines = [
        f"# Indice da Analise — {environment.upper()}",
        f"",
        f"**Gerado em:** {now.strftime('%Y-%m-%d %H:%M')} (BRT)  ",
        f"",
        f"## Arquivos Gerados",
        f"",
    ]

    for phase, fname in PHASE_FILE_MAP.items():
        fpath = os.path.join(docs_dir, fname)
        status = "OK" if os.path.isfile(fpath) else "AUSENTE"
        size = f"{os.path.getsize(fpath) // 1024} KB" if os.path.isfile(fpath) else "—"
        lines.append(f"- `{fname}` — {status} ({size})")

    if task_ids:
        lines += [
            f"",
            f"## Tasks Associadas",
            f"",
        ]
        for tid in task_ids:
            lines.append(f"- [{tid}](../../../kanbania-fresh/board/done/{tid}.md)")

    lines.append("")
    return "\n".join(lines)
