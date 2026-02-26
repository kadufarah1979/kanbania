---
id: sprint-068
title: "TecPag PCI P1: Checkers Req 2/3/8/10 + IaC SG + Kibana"
goal: "Implementar 4 checkers PCI prioritarios (Req 2, 3, 8, 10), revisar security groups vs Req 1, documentar modulos Terraform e criar dashboard Kibana para auditoria"
project: tecpag
start_date: "2026-04-06"
end_date: "2026-04-19"
status: planning
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-08
  - OKR-2026-Q2-09
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-23T13:00:00-03:00"
---

## Objetivo do Sprint

Iniciar a fase de hardening e conformidade PCI.
Implementar os checkers dos requisitos de maior impacto: criptografia em repouso (Req 3),
autenticacao (Req 8), configuracoes padrao (Req 2) e logging (Req 10).
Paralelamente: documentar modulos Terraform e criar dashboard Kibana para auditoria PCI.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0503 | Implementar checker PCI Req 2 (configuracoes e senhas padrao) | 3 | high | - |
| TASK-0504 | Implementar checker PCI Req 3 (criptografia de dados em repouso) | 3 | high | - |
| TASK-0505 | Implementar checker PCI Req 8 (autenticacao e gestao de identidade) | 3 | high | - |
| TASK-0506 | Implementar checker PCI Req 10 (logging e monitoramento de acessos) | 2 | high | - |
| TASK-0507 | Revisar e corrigir security groups vs PCI Req 1 (controles de rede) | 3 | high | - |
| TASK-0508 | Documentar modulos IAM, security-groups, launch_templates (README + exemplos) | 3 | medium | - |
| TASK-0509 | Configurar drift detection automatizado (hml + prd) | 2 | medium | - |
| TASK-0510 | Criar dashboard Kibana para logs de auditoria PCI Req 10 | 2 | medium | - |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q2-08: Conformidade PCI parcial — contribui para KR-01, KR-04
- OKR-2026-Q2-09: IaC validado — contribui para KR-01, KR-02

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
