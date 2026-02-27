# MCP Server — Analise de Infraestrutura AWS

Servidor MCP (Model Context Protocol) para automacao do fluxo completo de analise
de infraestrutura AWS: inventario, coleta de metricas, diagnostico remoto, analise
de anomalias e geracao de relatorio PDF.

## Estrutura

```
mcp/
  server.py                  # Entry point (FastMCP)
  requirements.txt
  tools/
    kanban.py                # Criar tasks, mover cards, activity.jsonl
    aws_inventory.py         # EC2, ALB, EBS, RDS via boto3
    cloudwatch.py            # Metricas CloudWatch (14 dias)
    ssm.py                   # Comandos via SSM Session Manager
    analyzer.py              # Deteccao de anomalias por thresholds
    report_builder.py        # Listagem e labels dos arquivos por fase
    pdf_generator.py         # Wrapper do pdf_report.py
  config/
    thresholds.yaml          # Limites de alerta por metrica
    report_structure.yaml    # Estrutura de fases e secoes
```

## Instalacao

```bash
pip install mcp pyyaml boto3 weasyprint
```

## Configuracao no Claude Code

Adicionar ao `~/.claude.json`:

```json
{
  "mcpServers": {
    "infra-analyzer": {
      "command": "python3",
      "args": ["/caminho/para/kanbania/mcp/server.py"],
      "env": {
        "KANBANIA_PATH": "/caminho/para/kanbania"
      }
    }
  }
}
```

`PDF_TEMPLATE_PATH` e opcional — por padrao usa `mcp/pdf_report.py` incluido no repositorio.

## Fluxo de Uso

### 1. Iniciar a analise

```
start_infra_analysis(
    project="meu-projeto",
    aws_profile="MEU-PROFILE",
    region="us-east-1",
    environment="prd",
    use_active_sprint=True,
)
```

Retorna: `sprint_id`, `task_ids` (5 tasks), `docs_dir`

### 2. Inventario de recursos

```
aws_inventory(
    project="meu-projeto",
    aws_profile="MEU-PROFILE",
    region="us-east-1",
    environment="prd",
    docs_dir="docs/analise-prd-2026-02-27",
    task_id="TASK-0650",
)
```

Retorna: `ec2_ids`, `alb_arns`, `ebs_ids`, `rds_ids`

### 3. Metricas CloudWatch

```
cloudwatch_metrics(
    ...
    ec2_ids=["i-0abc1234"],
    alb_arns=["arn:aws:..."],
    ebs_ids=["vol-0abc1234"],
    rds_ids=[],
    period_days=14,
)
```

### 4. Diagnostico SSM

```
ssm_diagnose(
    ...
    instance_id="i-0abc1234",
    checks=["sistema", "mongodb", "docker"],
)
```

### 5. Analise e relatorio

```
analyze_and_report(
    ...
    ec2_metrics=<output da etapa 3>,
    alb_metrics=<output da etapa 3>,
    ebs_metrics=<output da etapa 3>,
    ssm_results=<output da etapa 4>,
)
```

### 6. PDF final

```
generate_pdf_report(
    project="meu-projeto",
    environment="prd",
    docs_dir="docs/analise-prd-2026-02-27",
    task_id="TASK-0654",
    task_ids=["TASK-0650", "TASK-0651", "TASK-0652", "TASK-0653", "TASK-0654"],
    periodo="2026-02-13 a 2026-02-27",
    aws_account="123456789012",
    region="us-east-1",
)
```

## Thresholds

Editar `config/thresholds.yaml` para ajustar limites de alerta:

```yaml
ec2:
  cpu_avg_warning: 50      # % CPU media para warning
  cpu_avg_critical: 70     # % CPU media para critico
  cpu_max_critical: 80     # % CPU pico para critico
  credit_balance_min: 50   # creditos minimos (instancias T-series)

alb:
  response_time_warning_s: 1.0
  response_time_critical_s: 5.0
  error_5xx_critical: 100

ebs:
  queue_length_warning: 0.5
  queue_length_critical: 1.0
```

## Profiles AWS

O `aws_profile` deve existir em `~/.aws/credentials`.
O profile deve existir em `~/.aws/credentials`

## Kanban

- Tasks criadas seguem o schema canonico do AGENTS.md (secao 3)
- Activity log: `kanbania-fresh/logs/activity.jsonl`
- Board: resolve automaticamente conforme AGENTS.md secao 3.2
- Auto-approve: tasks de 1-2 SP com labels docs/infra sao movidas diretamente para done
