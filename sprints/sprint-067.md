---
id: sprint-067
title: "TecPag P0: Secrets gateways + correcoes inseguras + validacao IaC"
goal: "Migrar secrets dos 5 gateways para Secrets Manager, corrigir configuracoes inseguras (TLS, debug, root, portas) e ativar pipeline de validacao IaC"
project: tecpag
start_date: "2026-03-15"
end_date: "2026-03-28"
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

Completar a remediacao critica. Migrar os secrets dos 5 gateways restantes, corrigir
configuracoes inseguras de producao (TLS insecure, debug mode, containers root, portas debug, headers HTTP)
e ativar o pipeline de validacao IaC com tfsec + checkov.
Ao final: zero vulnerabilidades criticas abertas (OKR-Q1-04 atingido).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0493 | Migrar secrets gatewaypix, gatewayonline, gatewaypresencial para Secrets Manager | 3 | critical | - |
| TASK-0494 | Corrigir TLS insecure no otel-collector (configurar certificados) | 2 | high | - |
| TASK-0495 | Desabilitar debug mode em producao (otel-collector) | 1 | high | - |
| TASK-0496 | Corrigir containers rodando como root nos servicos criticos | 3 | high | - |
| TASK-0497 | Remover portas de debug expostas nos Docker Compose | 1 | high | - |
| TASK-0498 | Adicionar headers de seguranca HTTP no nginx (X-Frame-Options, CSP, HSTS) | 2 | high | - |
| TASK-0499 | Integrar tfsec no pipeline IaC GitLab | 2 | high | - |
| TASK-0500 | Integrar checkov no pipeline IaC GitLab | 2 | high | - |
| TASK-0501 | Revisar IAM policies para principio de minimo privilegio | 3 | high | - |
| TASK-0502 | Validar cobertura do Secrets Manager em todos os microsservicos | 2 | high | - |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q1-04: Eliminar vulnerabilidades criticas — contribui para KR-01, KR-02, KR-03
- OKR-2026-Q1-05: Gestao centralizada de secrets — contribui para KR-01, KR-02, KR-03, KR-04

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
