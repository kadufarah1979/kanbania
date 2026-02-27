"""
ssm.py — Execucao de comandos via AWS SSM Session Manager

Executa comandos remotos em instancias EC2 via SSM SendCommand.
Comandos configuráveis por tipo de diagnostico:
  - sistema: top, df, free, iostat
  - mongodb: db.stats(), serverStatus, collections, indexes
  - docker: docker stats, docker ps
"""

import os
import time
import boto3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

TZ_BR = timezone(timedelta(hours=-3))


# Comandos padrao por categoria de diagnostico
DEFAULT_CHECKS = {
    "sistema": [
        ("uptime", "uptime"),
        ("cpu_top", "top -bn1 | head -20"),
        ("memoria", "free -h"),
        ("disco", "df -h"),
        ("iostat", "iostat -x 1 3 2>/dev/null || echo 'iostat nao disponivel'"),
        ("processos_top10", "ps aux --sort=-%cpu | head -15"),
    ],
    "mongodb": [
        ("mongo_stats", "mongosh --quiet --eval 'JSON.stringify(db.stats())' 2>/dev/null || mongo --quiet --eval 'JSON.stringify(db.stats())' 2>/dev/null || echo 'mongosh nao disponivel'"),
        ("mongo_server_status", "mongosh --quiet --eval 'JSON.stringify(db.serverStatus().mem)' 2>/dev/null || mongo --quiet --eval 'JSON.stringify(db.serverStatus().mem)' 2>/dev/null || echo 'nao disponivel'"),
        ("mongo_connections", "mongosh --quiet --eval 'JSON.stringify(db.serverStatus().connections)' 2>/dev/null || echo 'nao disponivel'"),
        ("mongo_collections", "mongosh --quiet --eval 'db.getCollectionNames().forEach(function(c){var s=db.getCollection(c).stats();print(c+\": \"+s.size+\" bytes, \"+s.count+\" docs\")})' 2>/dev/null || echo 'nao disponivel'"),
        ("mongo_wiredtiger", "mongosh --quiet --eval 'var s=db.serverStatus().wiredTiger.cache; print(\"cache bytes: \"+s[\"bytes currently in the cache\"]+\" / \"+s[\"maximum bytes configured\"])' 2>/dev/null || echo 'nao disponivel'"),
    ],
    "docker": [
        ("docker_ps", "docker ps --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}' 2>/dev/null || echo 'docker nao disponivel'"),
        ("docker_stats", "docker stats --no-stream --format 'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}' 2>/dev/null || echo 'docker nao disponivel'"),
    ],
}


def run_ssm_command(
    ssm_client,
    instance_id: str,
    command: str,
    timeout_seconds: int = 60,
) -> str:
    """
    Executa um comando via SSM SendCommand e retorna a saida.
    """
    try:
        resp = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={"commands": [command]},
            TimeoutSeconds=timeout_seconds,
        )
        command_id = resp["Command"]["CommandId"]

        # Aguarda conclusao
        for _ in range(30):
            time.sleep(2)
            invocation = ssm_client.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id,
            )
            status = invocation["Status"]
            if status in ("Success", "Failed", "TimedOut", "Cancelled"):
                if status == "Success":
                    return invocation.get("StandardOutputContent", "").strip()
                else:
                    err = invocation.get("StandardErrorContent", "")
                    return f"[ERRO: {status}] {err}"

        return "[TIMEOUT] Comando nao concluido em 60s"
    except Exception as e:
        return f"[EXCECAO] {str(e)}"


def run_diagnostics(
    instance_id: str,
    aws_profile: str,
    region: str,
    checks: list[str] | None = None,
) -> dict[str, dict[str, str]]:
    """
    Executa diagnosticos SSM na instancia.
    checks: lista de categorias ['sistema', 'mongodb', 'docker'] — default: todas
    Retorna dict: {categoria: {label: output}}
    """
    if checks is None:
        checks = list(DEFAULT_CHECKS.keys())

    session = boto3.Session(profile_name=aws_profile, region_name=region)
    ssm = session.client("ssm")

    results = {}
    for category in checks:
        if category not in DEFAULT_CHECKS:
            continue
        results[category] = {}
        for label, cmd in DEFAULT_CHECKS[category]:
            output = run_ssm_command(ssm, instance_id, cmd)
            results[category][label] = output

    return results


def build_ssm_report(
    instance_id: str,
    environment: str,
    results: dict[str, dict[str, str]],
) -> str:
    """Constroi o markdown do diagnostico SSM."""
    now = datetime.now(TZ_BR)

    section_titles = {
        "sistema": "Estado do Sistema",
        "mongodb": "MongoDB",
        "docker": "Docker",
    }

    lines = [
        f"# Diagnostico via SSM",
        f"",
        f"**Instancia:** `{instance_id}`  ",
        f"**Ambiente:** {environment.upper()}  ",
        f"**Data:** {now.strftime('%Y-%m-%d %H:%M')} (BRT)  ",
        f"",
        f"---",
        f"",
    ]

    for category, commands in results.items():
        title = section_titles.get(category, category.title())
        lines += [
            f"## {title}",
            f"",
        ]
        for label, output in commands.items():
            display_label = label.replace("_", " ").title()
            lines += [
                f"### {display_label}",
                f"",
                f"```",
                output if output else "(sem saida)",
                f"```",
                f"",
            ]

    return "\n".join(lines)


def run_ssm_diagnose(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    instance_id: str,
    docs_dir: str,
    checks: list[str] | None = None,
) -> dict:
    """
    Executa diagnostico SSM completo e salva diagnostico-ssm.md.
    Retorna dict com caminho do arquivo e resultados brutos.
    """
    results = run_diagnostics(instance_id, aws_profile, region, checks)
    report_md = build_ssm_report(instance_id, environment, results)

    os.makedirs(docs_dir, exist_ok=True)
    output_path = os.path.join(docs_dir, "diagnostico-ssm.md")
    Path(output_path).write_text(report_md, encoding="utf-8")

    return {
        "output_path": output_path,
        "instance_id": instance_id,
        "results": results,
    }
