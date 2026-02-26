---
id: sprint-066
title: "TecPag P0: Revogacao de credenciais e Secrets Manager (plataforma)"
goal: "Revogar todas as credenciais AWS IAM expostas, rotacionar senhas de banco e migrar secrets da plataforma (3 microsservicos) para o AWS Secrets Manager"
project: tecpag
start_date: "2026-03-01"
end_date: "2026-03-14"
status: planning
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q1-04
  - OKR-2026-Q1-05
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-23T13:00:00-03:00"
---

## Objetivo do Sprint

Iniciar a remediacao critica das 12 vulnerabilidades abertas identificadas em 2026-02-02.
Foco: revogar credenciais IAM expostas, rotacionar todos os bancos de dados em producao
e migrar os secrets da plataforma (ms-authenticator, ms-webhook-event, ms-domain-report) para o Secrets Manager.
Ao final deste sprint: plataforma central sem credenciais hardcoded.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0482 | Revogar credenciais AWS IAM e tokens NPM/GitHub expostos | 2 | critical | - |
| TASK-0483 | Rotacionar senhas MongoDB e PostgreSQL em producao | 2 | critical | - |
| TASK-0484 | Rotacionar senhas Redis e RabbitMQ em producao | 1 | critical | - |
| TASK-0485 | Migrar secrets ms-authenticator para AWS Secrets Manager | 3 | critical | - |
| TASK-0486 | Migrar secrets ms-webhook-event e ms-domain-report para Secrets Manager | 2 | critical | - |
| TASK-0488 | Migrar senhas PostgreSQL e MongoDB Docker Compose para Secrets Manager | 3 | critical | - |
| TASK-0489 | Migrar senhas Redis e RabbitMQ Docker Compose para Secrets Manager | 2 | critical | - |
| TASK-0490 | Desabilitar acesso anonimo Grafana e definir senha forte | 1 | high | - |
| TASK-0491 | Corrigir token Discord exposto no deploy.sh (variavel de ambiente) | 1 | high | - |
| TASK-0492 | Migrar SECRET_KEY e SignOZ API Key do Frontend para Secrets Manager | 1 | high | - |
| TASK-0487 | Remover arquivos .env do historico Git (git filter-repo) | 3 | critical | - |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q1-04: Eliminar vulnerabilidades criticas — contribui para KR-01, KR-02
- OKR-2026-Q1-05: Gestao centralizada de secrets — contribui para KR-01, KR-02

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
-

### O que pode melhorar
-

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues**: -
- **Velocidade**: - pts/sprint
- **Taxa de conclusao**: -%
