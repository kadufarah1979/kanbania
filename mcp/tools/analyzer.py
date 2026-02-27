"""
analyzer.py — Deteccao de anomalias e ranking por severidade

Le os dados coletados (metricas CloudWatch + diagnostico SSM) e
compara com os thresholds.yaml para gerar lista de anomalias ranqueadas.

Severidades: critical > high > medium > low
"""

import os
import re
import yaml
from pathlib import Path
from typing import Optional

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "config")


def _load_thresholds() -> dict:
    path = os.path.join(CONFIG_DIR, "thresholds.yaml")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _severity_order(s: str) -> int:
    return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(s, 4)


def analyze_ec2(metrics: list[dict], thresholds: dict) -> list[dict]:
    """Analisa metricas EC2 e retorna lista de anomalias."""
    anomalies = []
    t = thresholds.get("ec2", {})

    for m in metrics:
        iid = m["instance_id"]
        cpu = m.get("cpu", {})
        credit = m.get("credit_balance", {})

        cpu_avg = cpu.get("avg")
        cpu_max = cpu.get("max")
        credit_avg = credit.get("avg")

        if cpu_avg is not None:
            if cpu_avg >= t.get("cpu_avg_critical", 70):
                anomalies.append({
                    "resource": iid,
                    "resource_type": "EC2",
                    "metric": "CPUUtilization (avg)",
                    "value": f"{cpu_avg:.1f}%",
                    "threshold": f">= {t.get('cpu_avg_critical', 70)}%",
                    "severity": "critical",
                    "description": f"CPU media critica em {iid}: {cpu_avg:.1f}%",
                })
            elif cpu_avg >= t.get("cpu_avg_warning", 50):
                anomalies.append({
                    "resource": iid,
                    "resource_type": "EC2",
                    "metric": "CPUUtilization (avg)",
                    "value": f"{cpu_avg:.1f}%",
                    "threshold": f">= {t.get('cpu_avg_warning', 50)}%",
                    "severity": "medium",
                    "description": f"CPU media elevada em {iid}: {cpu_avg:.1f}%",
                })

        if cpu_max is not None and cpu_max >= t.get("cpu_max_critical", 80):
            anomalies.append({
                "resource": iid,
                "resource_type": "EC2",
                "metric": "CPUUtilization (max)",
                "value": f"{cpu_max:.1f}%",
                "threshold": f">= {t.get('cpu_max_critical', 80)}%",
                "severity": "high",
                "description": f"Pico de CPU em {iid}: {cpu_max:.1f}%",
            })

        if credit_avg is not None and credit_avg < t.get("credit_balance_min", 50):
            anomalies.append({
                "resource": iid,
                "resource_type": "EC2",
                "metric": "CPUCreditBalance",
                "value": f"{credit_avg:.0f}",
                "threshold": f"< {t.get('credit_balance_min', 50)}",
                "severity": "high",
                "description": f"CPU credit balance baixo em {iid}: {credit_avg:.0f} creditos",
            })

    return anomalies


def analyze_alb(metrics: list[dict], thresholds: dict) -> list[dict]:
    """Analisa metricas ALB e retorna lista de anomalias."""
    anomalies = []
    t = thresholds.get("alb", {})

    for m in metrics:
        name = m.get("lb_name", m.get("lb_arn", "unknown"))
        rt = m.get("response_time_s", {})
        err5xx = m.get("error_5xx", {})
        err4xx = m.get("error_4xx", {})

        rt_avg = rt.get("avg")
        err5xx_avg = err5xx.get("avg")

        if rt_avg is not None:
            if rt_avg >= t.get("response_time_critical_s", 5.0):
                anomalies.append({
                    "resource": name,
                    "resource_type": "ALB",
                    "metric": "TargetResponseTime",
                    "value": f"{rt_avg:.3f}s",
                    "threshold": f">= {t.get('response_time_critical_s', 5.0)}s",
                    "severity": "critical",
                    "description": f"Latencia critica no ALB {name}: {rt_avg:.3f}s",
                })
            elif rt_avg >= t.get("response_time_warning_s", 1.0):
                anomalies.append({
                    "resource": name,
                    "resource_type": "ALB",
                    "metric": "TargetResponseTime",
                    "value": f"{rt_avg:.3f}s",
                    "threshold": f">= {t.get('response_time_warning_s', 1.0)}s",
                    "severity": "medium",
                    "description": f"Latencia elevada no ALB {name}: {rt_avg:.3f}s",
                })

        if err5xx_avg is not None and err5xx_avg >= t.get("error_5xx_critical", 100):
            anomalies.append({
                "resource": name,
                "resource_type": "ALB",
                "metric": "HTTPCode_ELB_5XX_Count",
                "value": f"{err5xx_avg:.0f}/h avg",
                "threshold": f">= {t.get('error_5xx_critical', 100)}/h",
                "severity": "critical",
                "description": f"Erros 5XX criticos no ALB {name}: {err5xx_avg:.0f}/h",
            })

    return anomalies


def analyze_ebs(metrics: list[dict], thresholds: dict) -> list[dict]:
    """Analisa metricas EBS e retorna lista de anomalias."""
    anomalies = []
    t = thresholds.get("ebs", {})

    for m in metrics:
        vid = m["volume_id"]
        ql = m.get("queue_length", {})
        rl = m.get("read_latency_s", {})
        wl = m.get("write_latency_s", {})
        burst = m.get("burst_balance", {})

        ql_avg = ql.get("avg")
        rl_avg = rl.get("avg")
        wl_avg = wl.get("avg")
        burst_avg = burst.get("avg")

        if ql_avg is not None:
            if ql_avg >= t.get("queue_length_critical", 1.0):
                anomalies.append({
                    "resource": vid,
                    "resource_type": "EBS",
                    "metric": "VolumeQueueLength",
                    "value": f"{ql_avg:.3f}",
                    "threshold": f">= {t.get('queue_length_critical', 1.0)}",
                    "severity": "critical",
                    "description": f"Queue length critica no volume {vid}: {ql_avg:.3f}",
                })
            elif ql_avg >= t.get("queue_length_warning", 0.5):
                anomalies.append({
                    "resource": vid,
                    "resource_type": "EBS",
                    "metric": "VolumeQueueLength",
                    "value": f"{ql_avg:.3f}",
                    "threshold": f">= {t.get('queue_length_warning', 0.5)}",
                    "severity": "medium",
                    "description": f"Queue length elevada no volume {vid}: {ql_avg:.3f}",
                })

        if rl_avg is not None and rl_avg >= t.get("read_latency_critical_s", 30.0):
            anomalies.append({
                "resource": vid,
                "resource_type": "EBS",
                "metric": "VolumeReadLatency",
                "value": f"{rl_avg:.4f}s",
                "threshold": f">= {t.get('read_latency_critical_s', 30.0)}s",
                "severity": "critical",
                "description": f"Read latency critica no volume {vid}: {rl_avg:.4f}s",
            })

        if burst_avg is not None and burst_avg < t.get("burst_balance_min", 30):
            anomalies.append({
                "resource": vid,
                "resource_type": "EBS",
                "metric": "BurstBalance",
                "value": f"{burst_avg:.1f}%",
                "threshold": f"< {t.get('burst_balance_min', 30)}%",
                "severity": "high",
                "description": f"Burst balance baixo no volume {vid}: {burst_avg:.1f}%",
            })

    return anomalies


def analyze_ssm_output(ssm_results: dict, thresholds: dict) -> list[dict]:
    """
    Analisa saida bruta do SSM buscando padroes de problema.
    Heuristicas simples para MongoDB e sistema.
    """
    anomalies = []
    t = thresholds.get("mongodb", {})
    mongo_results = ssm_results.get("mongodb", {})

    # Analisa wiredtiger cache
    wt_output = mongo_results.get("mongo_wiredtiger", "")
    if wt_output and "cache bytes:" in wt_output:
        try:
            parts = wt_output.split("cache bytes:")[1].strip().split("/")
            current = int(parts[0].strip())
            maximum = int(parts[1].strip())
            ratio = current / maximum if maximum > 0 else 0

            critical_ratio = t.get("working_set_cache_ratio_critical", 0.95)
            warning_ratio = t.get("working_set_cache_ratio_warning", 0.80)

            if ratio >= critical_ratio:
                anomalies.append({
                    "resource": "MongoDB",
                    "resource_type": "MongoDB",
                    "metric": "WiredTiger Cache Usage",
                    "value": f"{ratio:.1%} ({current/1024/1024/1024:.2f}GB / {maximum/1024/1024/1024:.2f}GB)",
                    "threshold": f">= {critical_ratio:.0%}",
                    "severity": "critical",
                    "description": f"Working set excede cache WiredTiger: {ratio:.1%} utilizado",
                })
            elif ratio >= warning_ratio:
                anomalies.append({
                    "resource": "MongoDB",
                    "resource_type": "MongoDB",
                    "metric": "WiredTiger Cache Usage",
                    "value": f"{ratio:.1%}",
                    "threshold": f">= {warning_ratio:.0%}",
                    "severity": "high",
                    "description": f"Cache WiredTiger com utilizacao elevada: {ratio:.1%}",
                })
        except (IndexError, ValueError):
            pass

    return anomalies


def generate_recommendations(anomalies: list[dict]) -> list[str]:
    """Gera lista de recomendacoes com base nas anomalias detectadas."""
    recs = []
    seen_types = set()

    for a in anomalies:
        key = (a["resource_type"], a["metric"])
        if key in seen_types:
            continue
        seen_types.add(key)

        rtype = a["resource_type"]
        metric = a["metric"]

        if rtype == "EC2" and "CPU" in metric and "Credit" not in metric:
            recs.append("Avaliar upgrade de tipo de instancia EC2 ou otimizacao da carga de trabalho")
        elif rtype == "EC2" and "Credit" in metric:
            recs.append("Considerar migrar instancias T-series para instancias de performance fixas (M ou C series)")
        elif rtype == "ALB" and "ResponseTime" in metric:
            recs.append("Investigar backends lentos — verificar health checks, pool de conexoes e timeouts")
        elif rtype == "ALB" and "5XX" in metric:
            recs.append("Investigar erros 5XX no ALB — verificar logs de acesso e status das instancias alvo")
        elif rtype == "EBS" and "QueueLength" in metric:
            recs.append("EBS saturado — considerar upgrade para gp3/io2 com IOPS provisionados")
        elif rtype == "EBS" and "BurstBalance" in metric:
            recs.append("Volume gp2 esgotando burst IOPS — migrar para gp3 para IOPS consistentes")
        elif rtype == "MongoDB" and "Cache" in metric:
            recs.append("Working set MongoDB excede cache — considerar upgrade de instancia ou sharding")

    if not recs:
        recs.append("Nenhuma anomalia critica detectada. Monitoramento preventivo recomendado.")

    return recs


def run_analysis(
    environment: str,
    docs_dir: str,
    ec2_metrics: list | None = None,
    alb_metrics: list | None = None,
    ebs_metrics: list | None = None,
    rds_metrics: list | None = None,
    ssm_results: dict | None = None,
) -> dict:
    """
    Executa analise completa, gera analise-consolidada.md.
    Retorna dict com anomalias e caminho do arquivo.
    """
    thresholds = _load_thresholds()

    anomalies = []
    if ec2_metrics:
        anomalies += analyze_ec2(ec2_metrics, thresholds)
    if alb_metrics:
        anomalies += analyze_alb(alb_metrics, thresholds)
    if ebs_metrics:
        anomalies += analyze_ebs(ebs_metrics, thresholds)
    if ssm_results:
        anomalies += analyze_ssm_output(ssm_results, thresholds)

    # Ordenar por severidade
    anomalies.sort(key=lambda a: _severity_order(a["severity"]))

    recommendations = generate_recommendations(anomalies)

    # Contar por severidade
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for a in anomalies:
        counts[a["severity"]] = counts.get(a["severity"], 0) + 1

    # Gerar markdown
    from datetime import datetime, timezone, timedelta
    TZ_BR = timezone(timedelta(hours=-3))
    now = datetime.now(TZ_BR)

    lines = [
        f"# Analise Consolidada — {environment.upper()}",
        f"",
        f"**Data:** {now.strftime('%Y-%m-%d %H:%M')} (BRT)  ",
        f"**Ambiente:** {environment.upper()}  ",
        f"",
        f"---",
        f"",
        f"## Resumo Executivo",
        f"",
        f"| Severidade | Quantidade |",
        f"|---|---|",
        f"| Critico | {counts['critical']} |",
        f"| Alto | {counts['high']} |",
        f"| Medio | {counts['medium']} |",
        f"| Baixo | {counts['low']} |",
        f"| **Total** | **{len(anomalies)}** |",
        f"",
    ]

    if counts["critical"] > 0:
        lines += [
            f"> **{counts['critical']} anomalia(s) critica(s) detectada(s). Acao imediata recomendada.**",
            f"",
        ]
    elif counts["high"] > 0:
        lines += [
            f"> {counts['high']} anomalia(s) de alta severidade requer(em) atencao.",
            f"",
        ]
    else:
        lines += [
            f"> Nenhuma anomalia critica ou alta detectada. Ambiente operando dentro dos limites.",
            f"",
        ]

    lines += [
        f"---",
        f"",
        f"## Anomalias Detectadas",
        f"",
        f"| # | Recurso | Tipo | Metrica | Valor | Threshold | Severidade |",
        f"|---|---|---|---|---|---|---|",
    ]

    for i, a in enumerate(anomalies, 1):
        sev = a["severity"].upper()
        lines.append(f"| {i} | `{a['resource']}` | {a['resource_type']} | {a['metric']} | {a['value']} | {a['threshold']} | **{sev}** |")

    if not anomalies:
        lines.append("| — | Nenhuma anomalia detectada | | | | | |")

    lines += [
        f"",
        f"---",
        f"",
        f"## Detalhamento por Severidade",
        f"",
    ]

    for sev in ["critical", "high", "medium", "low"]:
        sev_anomalies = [a for a in anomalies if a["severity"] == sev]
        if not sev_anomalies:
            continue
        sev_label = {"critical": "Critico", "high": "Alto", "medium": "Medio", "low": "Baixo"}[sev]
        lines += [f"### {sev_label}", f""]
        for a in sev_anomalies:
            lines += [f"- **{a['resource']}** ({a['resource_type']}): {a['description']}", f""]

    lines += [
        f"---",
        f"",
        f"## Recomendacoes",
        f"",
    ]
    for i, rec in enumerate(recommendations, 1):
        lines.append(f"{i}. {rec}")

    lines += [
        f"",
        f"---",
        f"",
        f"## Proximos Passos",
        f"",
        f"1. Priorizar anomalias criticas para remediacao imediata",
        f"2. Planejar sprint de melhorias com base no ranking de severidade",
        f"3. Revisar thresholds em `config/thresholds.yaml` se necessario",
        f"4. Agendar nova analise em 30 dias",
        f"",
    ]

    report_md = "\n".join(lines)
    os.makedirs(docs_dir, exist_ok=True)
    output_path = os.path.join(docs_dir, "analise-consolidada.md")
    Path(output_path).write_text(report_md, encoding="utf-8")

    return {
        "output_path": output_path,
        "anomalies": anomalies,
        "counts": counts,
        "recommendations": recommendations,
    }
