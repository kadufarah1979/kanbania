"""
pdf_generator.py — Wrapper do pdf_report.py do projeto INNOVAQ

Reutiliza generate_pdf() e apply_accents() sem modificacoes.
Localiza o template via env var PDF_TEMPLATE_PATH ou caminho padrao.
"""

import os
import sys
from pathlib import Path

PDF_TEMPLATE_PATH = os.environ.get(
    "PDF_TEMPLATE_PATH",
    "/home/carlosfarah/Projects/IaC/Innovaq/docs/templates/pdf_report.py",
)


def _import_pdf_module():
    """Importa o modulo pdf_report.py dinamicamente."""
    template_dir = str(Path(PDF_TEMPLATE_PATH).parent)
    if template_dir not in sys.path:
        sys.path.insert(0, template_dir)

    import importlib.util
    spec = importlib.util.spec_from_file_location("pdf_report", PDF_TEMPLATE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def generate_infra_pdf(
    project: str,
    environment: str,
    docs_dir: str,
    input_files: list[str],
    phase_labels: list[str],
    task_ids: list[str],
    output_path: str,
    periodo: str = "",
    aws_account: str = "",
    region: str = "",
) -> str:
    """
    Gera o PDF final de analise de infra.

    Args:
        project:      Slug do projeto kanbania
        environment:  Ambiente (dev/hml/qa/prd)
        docs_dir:     Diretorio com os .md gerados
        input_files:  Lista de caminhos .md para o PDF
        phase_labels: Labels dos separadores de fase
        task_ids:     IDs das tasks associadas
        output_path:  Caminho de saida do PDF
        periodo:      Periodo da analise (ex: "2026-02-13 a 2026-02-27")
        aws_account:  ID da conta AWS (opcional)
        region:       Regiao AWS (opcional)

    Returns:
        Caminho do PDF gerado.
    """
    pdf = _import_pdf_module()

    title = f"Analise de Infra — {environment.upper()} — {project}"
    subtitle = f"Ambiente {environment.upper()} — {project}"

    ambiente_parts = []
    if aws_account:
        ambiente_parts.append(f"AWS account {aws_account}")
    if region:
        ambiente_parts.append(region)
    ambiente_parts.append(environment.upper())
    ambiente = " — ".join(ambiente_parts)

    tasks_str = " / ".join(task_ids) if task_ids else ""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    return pdf.generate_pdf(
        inputs=input_files,
        output=output_path,
        title=title,
        subtitle=subtitle,
        tasks=tasks_str,
        periodo=periodo,
        ambiente=ambiente,
        phase_labels=phase_labels,
        footer="Documento gerado pelo departamento de DevOps da Amazonas Inovare",
    )
