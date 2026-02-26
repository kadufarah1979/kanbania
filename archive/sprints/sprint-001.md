---
id: sprint-001
title: "Reprovisionar HML espelhando DEV"
goal: "Destruir ambiente HML atual e reprovisionar do zero baseado na infraestrutura DEV, adaptando para a conta HML"
start_date: "2026-02-13"
end_date: "2026-02-27"
status: completed
project: mdm-terraform
capacity: 21
created_by: claude-code
okrs: []
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-13T12:00:00-03:00"
---

## Objetivo do Sprint

Reprovisionar completamente o ambiente HML do projeto MDM. O ambiente HML atual sera
destruido via cleanup_aws.py e o Terraform state sera limpo. Em seguida, os arquivos
de configuracao em stage/hml/ serao reescritos tendo como base o stage/dev/, adaptando
os valores especificos da conta HML (account 980921748409, profile devops, dominio hml,
VPC CIDR, key pair, etc.). Ao final, o ambiente HML tera a mesma arquitetura e servicos
que o DEV.

**Restricoes criticas:**
- NAO alterar nada na conta DEV (654654296472)
- NAO alterar nenhum modulo em modules/
- Alteracoes APENAS em stage/hml/
- Profile AWS: devops

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0001 | Mapear diferencas entre stage/dev e stage/hml | 2 | high | claude-code |
| TASK-0002 | Executar cleanup_aws.py na conta HML | 3 | critical | claude-code |
| TASK-0003 | Limpar Terraform state do HML | 1 | high | claude-code |
| TASK-0004 | Reescrever arquivos de configuracao base do HML | 3 | high | claude-code |
| TASK-0005 | Reescrever locals e modules.tf do HML espelhando DEV | 8 | high | claude-code |
| TASK-0006 | Executar terraform init, validate e plan | 2 | high | claude-code |
| TASK-0007 | Revisar plan e executar terraform apply | 2 | high | claude-code |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- Nenhum OKR vinculado neste momento

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues**: 0
- **Velocidade**: 0 pts/sprint
- **Taxa de conclusao**: 0%
