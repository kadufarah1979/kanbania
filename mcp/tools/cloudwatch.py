"""
cloudwatch.py — Coleta de metricas CloudWatch via boto3

Metricas coletadas:
- EC2: CPUUtilization, CPUCreditBalance, NetworkIn, NetworkOut
- ALB: TargetResponseTime, RequestCount, HTTPCode_ELB_5XX_Count, HTTPCode_ELB_4XX_Count
- EBS: VolumeQueueLength, VolumeReadOps, VolumeWriteOps, VolumeTotalReadTime, VolumeTotalWriteTime
- RDS: CPUUtilization, FreeableMemory, ReadLatency, WriteLatency, DatabaseConnections
"""

import os
import boto3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

TZ_BR = timezone(timedelta(hours=-3))


def _cw_client(session):
    return session.client("cloudwatch")


def _get_metric_stats(
    cw,
    namespace: str,
    metric_name: str,
    dimensions: list[dict],
    period_days: int,
    stat: str = "Average",
    period_seconds: int = 3600,
) -> dict:
    """Coleta estatisticas de uma metrica CloudWatch."""
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=period_days)

    try:
        resp = cw.get_metric_statistics(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=dimensions,
            StartTime=start_time,
            EndTime=end_time,
            Period=period_seconds,
            Statistics=[stat, "Maximum", "Minimum"],
        )
        datapoints = resp.get("Datapoints", [])
        if not datapoints:
            return {"avg": None, "max": None, "min": None, "count": 0}

        values = [dp[stat] for dp in datapoints]
        maxes = [dp["Maximum"] for dp in datapoints]
        mins = [dp["Minimum"] for dp in datapoints]
        return {
            "avg": round(sum(values) / len(values), 4),
            "max": round(max(maxes), 4),
            "min": round(min(mins), 4),
            "count": len(datapoints),
        }
    except Exception as e:
        return {"avg": None, "max": None, "min": None, "count": 0, "error": str(e)}


def collect_ec2_metrics(cw, instance_ids: list[str], period_days: int) -> list[dict]:
    results = []
    for iid in instance_ids:
        dims = [{"Name": "InstanceId", "Value": iid}]
        cpu = _get_metric_stats(cw, "AWS/EC2", "CPUUtilization", dims, period_days)
        credit = _get_metric_stats(cw, "AWS/EC2", "CPUCreditBalance", dims, period_days)
        net_in = _get_metric_stats(cw, "AWS/EC2", "NetworkIn", dims, period_days)
        net_out = _get_metric_stats(cw, "AWS/EC2", "NetworkOut", dims, period_days)
        results.append({
            "instance_id": iid,
            "cpu": cpu,
            "credit_balance": credit,
            "network_in_bytes": net_in,
            "network_out_bytes": net_out,
        })
    return results


def collect_alb_metrics(cw, lb_arns: list[str], period_days: int) -> list[dict]:
    results = []
    for arn in lb_arns:
        # ALB dimension usa o sufixo do ARN
        lb_dim = arn.split("loadbalancer/")[-1] if "loadbalancer/" in arn else arn
        dims = [{"Name": "LoadBalancer", "Value": lb_dim}]

        resp_time = _get_metric_stats(cw, "AWS/ApplicationELB", "TargetResponseTime", dims, period_days)
        req_count = _get_metric_stats(cw, "AWS/ApplicationELB", "RequestCount", dims, period_days, stat="Sum")
        err_5xx = _get_metric_stats(cw, "AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", dims, period_days, stat="Sum")
        err_4xx = _get_metric_stats(cw, "AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", dims, period_days, stat="Sum")

        results.append({
            "lb_arn": arn,
            "lb_name": lb_dim.split("/")[1] if "/" in lb_dim else lb_dim,
            "response_time_s": resp_time,
            "request_count": req_count,
            "error_5xx": err_5xx,
            "error_4xx": err_4xx,
        })
    return results


def collect_ebs_metrics(cw, volume_ids: list[str], period_days: int) -> list[dict]:
    results = []
    for vid in volume_ids:
        dims = [{"Name": "VolumeId", "Value": vid}]
        queue = _get_metric_stats(cw, "AWS/EBS", "VolumeQueueLength", dims, period_days)
        read_time = _get_metric_stats(cw, "AWS/EBS", "VolumeTotalReadTime", dims, period_days)
        write_time = _get_metric_stats(cw, "AWS/EBS", "VolumeTotalWriteTime", dims, period_days)
        read_ops = _get_metric_stats(cw, "AWS/EBS", "VolumeReadOps", dims, period_days, stat="Sum")
        write_ops = _get_metric_stats(cw, "AWS/EBS", "VolumeWriteOps", dims, period_days, stat="Sum")
        burst = _get_metric_stats(cw, "AWS/EBS", "BurstBalance", dims, period_days)

        results.append({
            "volume_id": vid,
            "queue_length": queue,
            "read_latency_s": read_time,
            "write_latency_s": write_time,
            "read_ops": read_ops,
            "write_ops": write_ops,
            "burst_balance": burst,
        })
    return results


def collect_rds_metrics(cw, db_ids: list[str], period_days: int) -> list[dict]:
    results = []
    for dbid in db_ids:
        dims = [{"Name": "DBInstanceIdentifier", "Value": dbid}]
        cpu = _get_metric_stats(cw, "AWS/RDS", "CPUUtilization", dims, period_days)
        mem = _get_metric_stats(cw, "AWS/RDS", "FreeableMemory", dims, period_days)
        read_lat = _get_metric_stats(cw, "AWS/RDS", "ReadLatency", dims, period_days)
        write_lat = _get_metric_stats(cw, "AWS/RDS", "WriteLatency", dims, period_days)
        conns = _get_metric_stats(cw, "AWS/RDS", "DatabaseConnections", dims, period_days)

        results.append({
            "db_id": dbid,
            "cpu": cpu,
            "freeable_memory_bytes": mem,
            "read_latency_s": read_lat,
            "write_latency_s": write_lat,
            "connections": conns,
        })
    return results


def _fmt_val(val, unit: str = "", scale: float = 1.0, decimals: int = 2) -> str:
    if val is None:
        return "—"
    return f"{val * scale:.{decimals}f}{unit}"


def build_cloudwatch_report(
    ec2_metrics: list,
    alb_metrics: list,
    ebs_metrics: list,
    rds_metrics: list,
    environment: str,
    period_days: int,
) -> str:
    end_date = datetime.now(TZ_BR)
    start_date = end_date - timedelta(days=period_days)

    lines = [
        f"# Coleta de Metricas CloudWatch",
        f"",
        f"**Ambiente:** {environment.upper()}  ",
        f"**Periodo:** {start_date.strftime('%Y-%m-%d')} a {end_date.strftime('%Y-%m-%d')} ({period_days} dias)  ",
        f"**Data da coleta:** {end_date.strftime('%Y-%m-%d %H:%M')} (BRT)  ",
        f"",
        f"---",
        f"",
        f"## Metricas EC2",
        f"",
        f"| Instancia | CPU Avg | CPU Max | Credit Balance (avg) | Net In (MB/h avg) | Net Out (MB/h avg) |",
        f"|---|---|---|---|---|---|",
    ]

    for m in ec2_metrics:
        cpu_avg = _fmt_val(m["cpu"]["avg"], "%")
        cpu_max = _fmt_val(m["cpu"]["max"], "%")
        credit = _fmt_val(m["credit_balance"]["avg"], " cred", decimals=0)
        net_in = _fmt_val(m["network_in_bytes"]["avg"], " MB", scale=1/1024/1024)
        net_out = _fmt_val(m["network_out_bytes"]["avg"], " MB", scale=1/1024/1024)
        lines.append(f"| {m['instance_id']} | {cpu_avg} | {cpu_max} | {credit} | {net_in} | {net_out} |")

    if not ec2_metrics:
        lines.append("| — | Nenhuma metrica EC2 coletada | | | | |")

    lines += [
        f"",
        f"---",
        f"",
        f"## Metricas ALB/NLB",
        f"",
        f"| Load Balancer | Resp Time Avg (s) | Resp Time Max (s) | Requests Total | Erros 5XX | Erros 4XX |",
        f"|---|---|---|---|---|---|",
    ]

    for m in alb_metrics:
        rt_avg = _fmt_val(m["response_time_s"]["avg"], "s", decimals=3)
        rt_max = _fmt_val(m["response_time_s"]["max"], "s", decimals=3)
        reqs = _fmt_val(m["request_count"]["avg"], "", decimals=0)
        e5xx = _fmt_val(m["error_5xx"]["avg"], "", decimals=0)
        e4xx = _fmt_val(m["error_4xx"]["avg"], "", decimals=0)
        lines.append(f"| {m['lb_name']} | {rt_avg} | {rt_max} | {reqs} | {e5xx} | {e4xx} |")

    if not alb_metrics:
        lines.append("| — | Nenhuma metrica ALB coletada | | | | |")

    lines += [
        f"",
        f"---",
        f"",
        f"## Metricas EBS",
        f"",
        f"| Volume | Queue Length Avg | Queue Length Max | Read Latency Avg | Write Latency Avg | Burst Balance |",
        f"|---|---|---|---|---|---|",
    ]

    for m in ebs_metrics:
        ql_avg = _fmt_val(m["queue_length"]["avg"], "", decimals=3)
        ql_max = _fmt_val(m["queue_length"]["max"], "", decimals=3)
        rl = _fmt_val(m["read_latency_s"]["avg"], "s", decimals=4)
        wl = _fmt_val(m["write_latency_s"]["avg"], "s", decimals=4)
        burst = _fmt_val(m["burst_balance"]["avg"], "%", decimals=1)
        lines.append(f"| {m['volume_id']} | {ql_avg} | {ql_max} | {rl} | {wl} | {burst} |")

    if not ebs_metrics:
        lines.append("| — | Nenhuma metrica EBS coletada | | | | |")

    if rds_metrics:
        lines += [
            f"",
            f"---",
            f"",
            f"## Metricas RDS",
            f"",
            f"| Instancia | CPU Avg | CPU Max | Memoria Livre Avg | Read Latency | Write Latency | Conexoes |",
            f"|---|---|---|---|---|---|---|",
        ]
        for m in rds_metrics:
            cpu_avg = _fmt_val(m["cpu"]["avg"], "%")
            cpu_max = _fmt_val(m["cpu"]["max"], "%")
            mem = _fmt_val(m["freeable_memory_bytes"]["avg"], " MB", scale=1/1024/1024, decimals=0)
            rl = _fmt_val(m["read_latency_s"]["avg"], "ms", scale=1000, decimals=2)
            wl = _fmt_val(m["write_latency_s"]["avg"], "ms", scale=1000, decimals=2)
            conns = _fmt_val(m["connections"]["avg"], "", decimals=0)
            lines.append(f"| {m['db_id']} | {cpu_avg} | {cpu_max} | {mem} | {rl} | {wl} | {conns} |")

    lines.append("")
    return "\n".join(lines)


def run_cloudwatch(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    docs_dir: str,
    ec2_ids: list[str],
    alb_arns: list[str],
    ebs_ids: list[str],
    rds_ids: list[str],
    period_days: int = 14,
) -> dict:
    """
    Coleta metricas CloudWatch e salva metricas-cloudwatch.md.
    Retorna dict com caminho do arquivo e metricas brutas.
    """
    session = boto3.Session(profile_name=aws_profile, region_name=region)
    cw = _cw_client(session)

    ec2_metrics = collect_ec2_metrics(cw, ec2_ids, period_days) if ec2_ids else []
    alb_metrics = collect_alb_metrics(cw, alb_arns, period_days) if alb_arns else []
    ebs_metrics = collect_ebs_metrics(cw, ebs_ids, period_days) if ebs_ids else []
    rds_metrics = collect_rds_metrics(cw, rds_ids, period_days) if rds_ids else []

    report_md = build_cloudwatch_report(
        ec2_metrics, alb_metrics, ebs_metrics, rds_metrics, environment, period_days,
    )

    os.makedirs(docs_dir, exist_ok=True)
    output_path = os.path.join(docs_dir, "metricas-cloudwatch.md")
    Path(output_path).write_text(report_md, encoding="utf-8")

    return {
        "output_path": output_path,
        "ec2_metrics": ec2_metrics,
        "alb_metrics": alb_metrics,
        "ebs_metrics": ebs_metrics,
        "rds_metrics": rds_metrics,
    }
