"""
aws_inventory.py — Inventario de recursos AWS via boto3

Coleta: EC2, ALB, NLB, EBS, RDS
Compara com Terraform se repo_path fornecido.
Salva resultado em docs/analise-{env}-{date}/inventario.md
"""

import os
import boto3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

TZ_BR = timezone(timedelta(hours=-3))


def _boto_session(aws_profile: str, region: str):
    return boto3.Session(profile_name=aws_profile, region_name=region)


def _fmt_tags(tags: list) -> str:
    if not tags:
        return ""
    d = {t["Key"]: t["Value"] for t in tags}
    return d.get("Name", "")


def collect_ec2(session) -> list[dict]:
    ec2 = session.client("ec2")
    instances = []
    paginator = ec2.get_paginator("describe_instances")
    for page in paginator.paginate():
        for res in page["Reservations"]:
            for inst in res["Instances"]:
                instances.append({
                    "id": inst["InstanceId"],
                    "name": _fmt_tags(inst.get("Tags", [])),
                    "type": inst["InstanceType"],
                    "state": inst["State"]["Name"],
                    "az": inst["Placement"]["AvailabilityZone"],
                    "private_ip": inst.get("PrivateIpAddress", ""),
                    "public_ip": inst.get("PublicIpAddress", ""),
                    "launch_time": inst["LaunchTime"].strftime("%Y-%m-%d"),
                })
    return instances


def collect_alb(session) -> list[dict]:
    elbv2 = session.client("elbv2")
    lbs = []
    paginator = elbv2.get_paginator("describe_load_balancers")
    for page in paginator.paginate():
        for lb in page["LoadBalancers"]:
            # Target groups
            tgs_resp = elbv2.describe_target_groups(LoadBalancerArn=lb["LoadBalancerArn"])
            tg_names = [tg["TargetGroupName"] for tg in tgs_resp.get("TargetGroups", [])]
            lbs.append({
                "name": lb["LoadBalancerName"],
                "type": lb["Type"],
                "scheme": lb["Scheme"],
                "state": lb["State"]["Code"],
                "arn": lb["LoadBalancerArn"],
                "dns": lb["DNSName"],
                "target_groups": tg_names,
            })
    return lbs


def collect_ebs(session) -> list[dict]:
    ec2 = session.client("ec2")
    volumes = []
    paginator = ec2.get_paginator("describe_volumes")
    for page in paginator.paginate():
        for vol in page["Volumes"]:
            attachments = vol.get("Attachments", [])
            attached_to = attachments[0]["InstanceId"] if attachments else "unattached"
            volumes.append({
                "id": vol["VolumeId"],
                "name": _fmt_tags(vol.get("Tags", [])),
                "type": vol["VolumeType"],
                "size_gb": vol["Size"],
                "state": vol["State"],
                "iops": vol.get("Iops", ""),
                "throughput": vol.get("Throughput", ""),
                "attached_to": attached_to,
                "az": vol["AvailabilityZone"],
            })
    return volumes


def collect_rds(session) -> list[dict]:
    rds = session.client("rds")
    dbs = []
    paginator = rds.get_paginator("describe_db_instances")
    for page in paginator.paginate():
        for db in page["DBInstances"]:
            dbs.append({
                "id": db["DBInstanceIdentifier"],
                "engine": f"{db['Engine']} {db['EngineVersion']}",
                "class": db["DBInstanceClass"],
                "status": db["DBInstanceStatus"],
                "storage_gb": db["AllocatedStorage"],
                "storage_type": db["StorageType"],
                "multi_az": db["MultiAZ"],
                "endpoint": db.get("Endpoint", {}).get("Address", ""),
            })
    return dbs


def _terraform_ec2_ids(repo_path: str) -> set[str]:
    """Extrai IDs de instancias EC2 do state Terraform (busca simples em .tfstate)."""
    ids = set()
    if not repo_path:
        return ids
    for tfstate in Path(repo_path).rglob("*.tfstate"):
        try:
            import json
            data = json.loads(tfstate.read_text())
            resources = data.get("resources", [])
            for res in resources:
                if res.get("type") == "aws_instance":
                    for inst in res.get("instances", []):
                        iid = inst.get("attributes", {}).get("id")
                        if iid:
                            ids.add(iid)
        except Exception:
            pass
    return ids


def build_inventory_report(
    ec2_instances: list,
    load_balancers: list,
    ebs_volumes: list,
    rds_instances: list,
    environment: str,
    region: str,
    repo_path: str = "",
) -> str:
    """Constroi o markdown do inventario."""
    lines = [
        f"# Inventario de Recursos AWS",
        f"",
        f"**Ambiente:** {environment.upper()}  ",
        f"**Regiao:** {region}  ",
        f"**Data:** {datetime.now(TZ_BR).strftime('%Y-%m-%d %H:%M')} (BRT)  ",
        f"",
        f"---",
        f"",
        f"## Instancias EC2",
        f"",
        f"| ID | Nome | Tipo | Estado | AZ | IP Privado |",
        f"|---|---|---|---|---|---|",
    ]
    for i in ec2_instances:
        lines.append(f"| {i['id']} | {i['name']} | {i['type']} | {i['state']} | {i['az']} | {i['private_ip']} |")

    if not ec2_instances:
        lines.append("| — | Nenhuma instancia encontrada | | | | |")

    lines += [
        f"",
        f"**Total:** {len(ec2_instances)} instancia(s)",
        f"",
        f"---",
        f"",
        f"## Load Balancers (ALB/NLB)",
        f"",
        f"| Nome | Tipo | Scheme | Estado | Target Groups |",
        f"|---|---|---|---|---|",
    ]
    for lb in load_balancers:
        tgs = ", ".join(lb["target_groups"]) or "—"
        lines.append(f"| {lb['name']} | {lb['type']} | {lb['scheme']} | {lb['state']} | {tgs} |")

    if not load_balancers:
        lines.append("| — | Nenhum LB encontrado | | | |")

    lines += [
        f"",
        f"**Total:** {len(load_balancers)} load balancer(s)",
        f"",
        f"---",
        f"",
        f"## Volumes EBS",
        f"",
        f"| ID | Nome | Tipo | Tamanho | Estado | Anexado a |",
        f"|---|---|---|---|---|---|",
    ]
    for v in ebs_volumes:
        size = f"{v['size_gb']} GB"
        lines.append(f"| {v['id']} | {v['name']} | {v['type']} | {size} | {v['state']} | {v['attached_to']} |")

    unattached = [v for v in ebs_volumes if v["attached_to"] == "unattached"]
    if not ebs_volumes:
        lines.append("| — | Nenhum volume encontrado | | | | |")

    lines += [
        f"",
        f"**Total:** {len(ebs_volumes)} volume(s)  ",
        f"**Orfaos (unattached):** {len(unattached)}",
        f"",
        f"---",
        f"",
        f"## Bancos de Dados RDS",
        f"",
        f"| ID | Engine | Classe | Estado | Storage | Multi-AZ |",
        f"|---|---|---|---|---|---|",
    ]
    for db in rds_instances:
        lines.append(f"| {db['id']} | {db['engine']} | {db['class']} | {db['status']} | {db['storage_gb']} GB | {db['multi_az']} |")

    if not rds_instances:
        lines.append("| — | Nenhuma instancia RDS encontrada | | | | |")

    lines += [
        f"",
        f"**Total:** {len(rds_instances)} instancia(s) RDS",
        f"",
    ]

    # Comparativo Terraform
    if repo_path:
        tf_ids = _terraform_ec2_ids(repo_path)
        aws_ids = {i["id"] for i in ec2_instances}
        only_aws = aws_ids - tf_ids
        only_tf = tf_ids - aws_ids

        lines += [
            f"---",
            f"",
            f"## Comparativo Terraform vs AWS",
            f"",
            f"| Situacao | Instancias |",
            f"|---|---|",
            f"| Gerenciadas pelo Terraform | {len(tf_ids & aws_ids)} |",
            f"| Somente na AWS (orfas) | {len(only_aws)} |",
            f"| Somente no Terraform (inexistentes) | {len(only_tf)} |",
            f"",
        ]
        if only_aws:
            lines.append("**Instancias orfas (nao gerenciadas pelo Terraform):**")
            for iid in only_aws:
                lines.append(f"- `{iid}`")
            lines.append("")

    return "\n".join(lines)


def run_inventory(
    project: str,
    aws_profile: str,
    region: str,
    environment: str,
    docs_dir: str,
    repo_path: str = "",
) -> dict:
    """
    Executa inventario completo e salva inventario.md.
    Retorna dict com resource_ids e caminho do arquivo gerado.
    """
    session = _boto_session(aws_profile, region)

    ec2_instances = collect_ec2(session)
    load_balancers = collect_alb(session)
    ebs_volumes = collect_ebs(session)
    rds_instances = collect_rds(session)

    report_md = build_inventory_report(
        ec2_instances, load_balancers, ebs_volumes, rds_instances,
        environment, region, repo_path,
    )

    os.makedirs(docs_dir, exist_ok=True)
    output_path = os.path.join(docs_dir, "inventario.md")
    Path(output_path).write_text(report_md, encoding="utf-8")

    return {
        "output_path": output_path,
        "ec2_ids": [i["id"] for i in ec2_instances],
        "alb_arns": [lb["arn"] for lb in load_balancers],
        "ebs_ids": [v["id"] for v in ebs_volumes],
        "rds_ids": [db["id"] for db in rds_instances],
        "ec2_instances": ec2_instances,
        "load_balancers": load_balancers,
        "ebs_volumes": ebs_volumes,
        "rds_instances": rds_instances,
    }
