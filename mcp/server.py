#!/usr/bin/env python3
"""
server.py — MCP Server: Analise de Infraestrutura AWS

Ponto de entrada do servidor MCP. Registra as tools no FastMCP e
orquestra o fluxo completo de analise de infraestrutura.

Tools registradas:
  - start_infra_analysis     : Configura sprint e cria tasks no kanbania
  - aws_inventory            : Inventario de recursos EC2/ALB/EBS/RDS
  - cloudwatch_metrics       : Coleta metricas CloudWatch (14 dias)
  - ssm_diagnose             : Diagnostico via SSM Session Manager
  - analyze_and_report       : Analisa anomalias e gera relatorio consolidado
  - generate_pdf_report      : Gera PDF final com todas as fases

Configuracao:
  - KANBANIA_PATH            : Caminho para o kanbania-fresh (default: ~/kanbania-fresh)
  - PDF_TEMPLATE_PATH        : Caminho para pdf_report.py (default: INNOVAQ templates)

Uso:
  python3 server.py

Adicionar ao ~/.claude.json:
  {
    "mcpServers": {
      "infra-analyzer": {
        "command": "python3",
        "args": ["/home/carlosfarah/kanbania-fresh/mcp/server.py"],
        "env": {
          "KANBANIA_PATH": "/home/carlosfarah/kanbania-fresh",
          "PDF_TEMPLATE_PATH": "/home/carlosfarah/Projects/IaC/Innovaq/docs/templates/pdf_report.py"
        }
      }
    }
  }
"""

import os
import sys
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Adiciona o diretorio do servidor ao path
sys.path.insert(0, os.path.dirname(__file__))

from mcp.server.fastmcp import FastMCP

from tools.kanban import (
    get_next_task_id,
    get_active_sprint,
    create_sprint,
    create_task,
    claim_task,
    complete_task,
    move_task,
    log_activity,
    _board_path,
    KANBANIA_PATH,
)
from tools.aws_inventory import run_inventory
from tools.cloudwatch import run_cloudwatch
from tools.ssm import run_ssm_diagnose
from tools.analyzer import run_analysis
from tools.report_builder import list_generated_files, get_phase_labels
from tools.pdf_generator import generate_infra_pdf

TZ_BR = timezone(timedelta(hours=-3))

mcp = FastMCP(
    name="infra-analyzer",
    instructions=(
        "MCP Server para analise de infraestrutura AWS. "
        "Execute start_infra_analysis primeiro para configurar a sprint e as tasks, "
        "depois execute cada tool na ordem: aws_inventory, cloudwatch_metrics, "
        "ssm_diagnose, analyze_and_report e generate_pdf_report."
    ),
)


# ---------------------------------------------------------------------------
# Tool: start_infra_analysis
# ---------------------------------------------------------------------------

@mcp.tool()
def start_infra_analysis(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    use_active_sprint: bool = True,
    sprint_label: str = "",
) -> dict:
    """
    Ponto de entrada da analise de infra. Configura sprint e cria tasks no kanbania.

    Args:
        project:            Slug do projeto no kanbania (ex: 'innovaq')
        aws_profile:        Profile AWS em ~/.aws/credentials (ex: 'INNOVAQ-PRD')
        region:             Regiao AWS (ex: 'us-east-1')
        environment:        Ambiente analisado: dev | hml | qa | prd
        use_active_sprint:  True = usar sprint ativa; False = criar sprint dedicada
        sprint_label:       Label da nova sprint (usado apenas se use_active_sprint=False)

    Returns:
        dict com: sprint_id, task_ids, docs_dir, next_step
    """
    # 1. Determinar sprint
    if use_active_sprint:
        sprint_id = get_active_sprint(project)
        if not sprint_id:
            sprint_id = get_active_sprint("global")  # fallback global
        if not sprint_id:
            return {
                "error": (
                    f"Nenhuma sprint ativa encontrada para o projeto '{project}'. "
                    "Use use_active_sprint=False para criar uma sprint dedicada."
                )
            }
    else:
        date_str = datetime.now(TZ_BR).strftime("%Y-%m-%d")
        label = sprint_label or f"Analise de Infra — {environment} {date_str}"
        sprint_id = create_sprint(project, label)

    # 2. Determinar proximo ID de task
    base_id_str = get_next_task_id(project)
    base_num = int(base_id_str.split("-")[1])

    task_configs = [
        {
            "suffix": 0,
            "title": f"Inventario de recursos AWS — {environment.upper()}",
            "story_points": 1,
            "labels": ["infra", "research"],
            "description": (
                f"Listar todos os recursos AWS do ambiente {environment.upper()}: "
                "EC2, ALB/NLB, EBS e RDS. Comparar com Terraform se repo disponivel. "
                "Identificar recursos orfaos e divergencias."
            ),
        },
        {
            "suffix": 1,
            "title": f"Coleta de metricas CloudWatch — {environment.upper()}",
            "story_points": 2,
            "labels": ["infra", "devops"],
            "description": (
                f"Coletar metricas CloudWatch dos ultimos 14 dias para o ambiente {environment.upper()}: "
                "CPUUtilization, NetworkIn/Out (EC2), TargetResponseTime, 5XX/4XX (ALB), "
                "VolumeQueueLength, ReadLatency (EBS)."
            ),
        },
        {
            "suffix": 2,
            "title": f"Diagnostico via SSM — {environment.upper()}",
            "story_points": 2,
            "labels": ["infra", "devops"],
            "description": (
                f"Executar diagnostico remoto via SSM no ambiente {environment.upper()}: "
                "estado do sistema (CPU, memoria, disco), MongoDB (stats, serverStatus, "
                "wiredtiger cache, colecoes) e Docker (ps, stats)."
            ),
        },
        {
            "suffix": 3,
            "title": f"Analise e relatorio de infra — {environment.upper()}",
            "story_points": 2,
            "labels": ["infra", "docs"],
            "description": (
                f"Consolidar dados coletados das fases anteriores para o ambiente {environment.upper()}, "
                "detectar anomalias via thresholds.yaml, ranquear por severidade "
                "(critico/alto/medio/baixo) e gerar analise-consolidada.md."
            ),
        },
        {
            "suffix": 4,
            "title": f"Geracao do PDF final — {environment.upper()}",
            "story_points": 1,
            "labels": ["docs"],
            "description": (
                f"Gerar o PDF consolidado da analise de infra {environment.upper()} "
                "com todas as fases, usando o template padrao INNOVAQ."
            ),
        },
    ]

    # 3. Criar tasks com depends_on encadeados
    task_ids = []
    for i, cfg in enumerate(task_configs):
        tid = f"TASK-{base_num + i:04d}"
        depends_on = [f"TASK-{base_num + i - 1:04d}"] if i > 0 else []
        blocks = [f"TASK-{base_num + i + 1:04d}"] if i < len(task_configs) - 1 else []

        create_task(
            project=project,
            title=cfg["title"],
            sprint=sprint_id,
            priority="high" if i < 3 else "medium",
            labels=cfg["labels"],
            story_points=cfg["story_points"],
            depends_on=depends_on,
            blocks=blocks,
            description=cfg["description"],
            task_id=tid,
        )
        task_ids.append(tid)

    # 4. Definir docs_dir
    date_str = datetime.now(TZ_BR).strftime("%Y-%m-%d")
    docs_dir = f"docs/analise-{environment}-{date_str}"

    # 5. Log
    log_activity(
        "create",
        f"analise-{environment}-{date_str}",
        f"Analise de infra configurada: {len(task_ids)} tasks criadas para {project}/{environment}",
        project,
    )

    return {
        "sprint_id": sprint_id,
        "task_ids": task_ids,
        "docs_dir": docs_dir,
        "project": project,
        "aws_profile": aws_profile,
        "region": region,
        "environment": environment,
        "next_step": (
            f"Tasks criadas: {', '.join(task_ids)}. "
            f"Execute aws_inventory com task_id={task_ids[0]}, "
            f"project={project}, aws_profile={aws_profile}, region={region}, "
            f"environment={environment}, docs_dir={docs_dir}"
        ),
    }


# ---------------------------------------------------------------------------
# Tool: aws_inventory
# ---------------------------------------------------------------------------

@mcp.tool()
def aws_inventory(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    docs_dir: str,
    task_id: str,
    repo_path: str = "",
) -> dict:
    """
    Executa inventario de recursos AWS (EC2, ALB/NLB, EBS, RDS).

    Args:
        project:      Slug do projeto kanbania
        aws_profile:  Profile AWS
        region:       Regiao AWS
        environment:  Ambiente (dev/hml/qa/prd)
        docs_dir:     Diretorio de saida dos .md
        task_id:      ID da task de inventario (TASK-NNNN)
        repo_path:    Caminho do repositorio Terraform (opcional, para comparativo)

    Returns:
        dict com resource_ids e caminho do arquivo gerado
    """
    claim_task(task_id, project)

    try:
        result = run_inventory(
            project=project,
            aws_profile=aws_profile,
            region=region,
            environment=environment,
            docs_dir=docs_dir,
            repo_path=repo_path,
        )
        complete_task(task_id, project, f"Inventario concluido: {result['output_path']}")
        result["task_id"] = task_id
        result["next_step"] = (
            f"Inventario salvo em {result['output_path']}. "
            f"Execute cloudwatch_metrics com ec2_ids={result['ec2_ids'][:3]}... "
            f"alb_arns e ebs_ids do resultado."
        )
        return result
    except Exception as e:
        move_task(task_id, project, "backlog")
        return {"error": str(e), "task_id": task_id}


# ---------------------------------------------------------------------------
# Tool: cloudwatch_metrics
# ---------------------------------------------------------------------------

@mcp.tool()
def cloudwatch_metrics(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    docs_dir: str,
    task_id: str,
    ec2_ids: list[str],
    alb_arns: list[str],
    ebs_ids: list[str],
    rds_ids: list[str],
    period_days: int = 14,
) -> dict:
    """
    Coleta metricas CloudWatch dos ultimos N dias.

    Args:
        project:      Slug do projeto kanbania
        aws_profile:  Profile AWS
        region:       Regiao AWS
        environment:  Ambiente
        docs_dir:     Diretorio de saida
        task_id:      ID da task (TASK-NNNN)
        ec2_ids:      Lista de IDs de instancias EC2
        alb_arns:     Lista de ARNs de load balancers
        ebs_ids:      Lista de IDs de volumes EBS
        rds_ids:      Lista de IDs de instancias RDS
        period_days:  Numero de dias para coleta (default: 14)

    Returns:
        dict com metricas e caminho do arquivo gerado
    """
    claim_task(task_id, project)

    try:
        result = run_cloudwatch(
            project=project,
            aws_profile=aws_profile,
            region=region,
            environment=environment,
            docs_dir=docs_dir,
            ec2_ids=ec2_ids,
            alb_arns=alb_arns,
            ebs_ids=ebs_ids,
            rds_ids=rds_ids,
            period_days=period_days,
        )
        complete_task(task_id, project, f"Metricas CloudWatch coletadas: {result['output_path']}")
        result["task_id"] = task_id
        result["next_step"] = (
            f"Metricas salvas em {result['output_path']}. "
            "Execute ssm_diagnose com instance_id da instancia principal."
        )
        return result
    except Exception as e:
        move_task(task_id, project, "backlog")
        return {"error": str(e), "task_id": task_id}


# ---------------------------------------------------------------------------
# Tool: ssm_diagnose
# ---------------------------------------------------------------------------

@mcp.tool()
def ssm_diagnose(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    docs_dir: str,
    task_id: str,
    instance_id: str,
    checks: list[str] | None = None,
) -> dict:
    """
    Executa diagnostico remoto via SSM Session Manager.

    Args:
        project:      Slug do projeto kanbania
        aws_profile:  Profile AWS
        region:       Regiao AWS
        environment:  Ambiente
        docs_dir:     Diretorio de saida
        task_id:      ID da task (TASK-NNNN)
        instance_id:  ID da instancia EC2 alvo (ex: 'i-0abc1234')
        checks:       Categorias de diagnostico: ['sistema', 'mongodb', 'docker']
                      Default: todas as categorias

    Returns:
        dict com resultados SSM e caminho do arquivo gerado
    """
    claim_task(task_id, project)

    try:
        result = run_ssm_diagnose(
            project=project,
            aws_profile=aws_profile,
            region=region,
            environment=environment,
            instance_id=instance_id,
            docs_dir=docs_dir,
            checks=checks,
        )
        complete_task(task_id, project, f"Diagnostico SSM concluido: {result['output_path']}")
        result["task_id"] = task_id
        result["next_step"] = (
            f"Diagnostico salvo em {result['output_path']}. "
            "Execute analyze_and_report passando docs_dir e os task_ids."
        )
        return result
    except Exception as e:
        move_task(task_id, project, "backlog")
        return {"error": str(e), "task_id": task_id}


# ---------------------------------------------------------------------------
# Tool: analyze_and_report
# ---------------------------------------------------------------------------

@mcp.tool()
def analyze_and_report(
    project: str,
    environment: str,
    docs_dir: str,
    task_id: str,
    ec2_metrics: list | None = None,
    alb_metrics: list | None = None,
    ebs_metrics: list | None = None,
    rds_metrics: list | None = None,
    ssm_results: dict | None = None,
) -> dict:
    """
    Analisa os dados coletados, detecta anomalias e gera relatorio consolidado.

    Args:
        project:      Slug do projeto kanbania
        environment:  Ambiente
        docs_dir:     Diretorio com os .md gerados
        task_id:      ID da task de analise (TASK-NNNN)
        ec2_metrics:  Metricas EC2 (output de cloudwatch_metrics)
        alb_metrics:  Metricas ALB
        ebs_metrics:  Metricas EBS
        rds_metrics:  Metricas RDS
        ssm_results:  Resultados SSM (output de ssm_diagnose)

    Returns:
        dict com anomalias, contagens e caminho do relatorio
    """
    claim_task(task_id, project)

    try:
        result = run_analysis(
            environment=environment,
            docs_dir=docs_dir,
            ec2_metrics=ec2_metrics,
            alb_metrics=alb_metrics,
            ebs_metrics=ebs_metrics,
            rds_metrics=rds_metrics,
            ssm_results=ssm_results,
        )
        complete_task(task_id, project, f"Analise concluida: {result['output_path']}")
        result["task_id"] = task_id
        result["next_step"] = (
            f"Relatorio salvo em {result['output_path']}. "
            "Execute generate_pdf_report para gerar o PDF final."
        )
        return result
    except Exception as e:
        move_task(task_id, project, "backlog")
        return {"error": str(e), "task_id": task_id}


# ---------------------------------------------------------------------------
# Tool: generate_pdf_report
# ---------------------------------------------------------------------------

@mcp.tool()
def generate_pdf_report(
    project: str,
    environment: str,
    docs_dir: str,
    task_id: str,
    task_ids: list[str],
    output_path: str = "",
    periodo: str = "",
    aws_account: str = "",
    region: str = "",
) -> dict:
    """
    Gera o PDF final consolidando todas as fases da analise.

    Args:
        project:      Slug do projeto kanbania
        environment:  Ambiente
        docs_dir:     Diretorio com os .md gerados
        task_id:      ID da task de geracao de PDF (TASK-NNNN)
        task_ids:     Todos os IDs de tasks da analise (para labels e metadados)
        output_path:  Caminho de saida do PDF (default: docs_dir/relatorio-completo.pdf)
        periodo:      Periodo da analise (ex: '2026-02-13 a 2026-02-27')
        aws_account:  ID da conta AWS
        region:       Regiao AWS

    Returns:
        dict com caminho do PDF gerado
    """
    claim_task(task_id, project)

    try:
        input_files = list_generated_files(docs_dir)
        if not input_files:
            raise ValueError(f"Nenhum arquivo .md encontrado em {docs_dir}")

        phase_labels = get_phase_labels(docs_dir, task_ids)

        if not output_path:
            output_path = os.path.join(docs_dir, "relatorio-completo.pdf")

        pdf_path = generate_infra_pdf(
            project=project,
            environment=environment,
            docs_dir=docs_dir,
            input_files=input_files,
            phase_labels=phase_labels,
            task_ids=task_ids,
            output_path=output_path,
            periodo=periodo,
            aws_account=aws_account,
            region=region,
        )

        complete_task(task_id, project, f"PDF gerado: {pdf_path}")
        size_kb = os.path.getsize(pdf_path) // 1024

        return {
            "pdf_path": pdf_path,
            "size_kb": size_kb,
            "input_files": input_files,
            "phase_labels": phase_labels,
            "task_id": task_id,
            "message": (
                f"PDF gerado com sucesso: {pdf_path} ({size_kb} KB). "
                f"Fases incluidas: {len(input_files)}. "
                f"Analise de infra {environment.upper()} concluida."
            ),
        }
    except Exception as e:
        move_task(task_id, project, "backlog")
        return {"error": str(e), "task_id": task_id}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
