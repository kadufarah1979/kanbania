---
id: sprint-069
title: "TecPag PCI P1: Checkers Req 4/5/6/7 + CI/CD pipeline + Alertas"
goal: "Implementar 4 checkers PCI (Req 4, 5, 6, 7), ativar pipeline CI/CD com pci-automation e configurar alertas Zabbix de seguranca"
project: tecpag
start_date: "2026-04-20"
end_date: "2026-05-03"
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

Atingir 9/14 checkers PCI ao final deste sprint (Req 1 existente + Req 2,3,4,5,6,7,8,10 novos).
Ativar pipeline CI/CD completo (build + test + deploy-hml) e configurar alertas Zabbix
para monitoramento proativo de eventos de seguranca.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0511 | Implementar checker PCI Req 4 (criptografia de dados em transito) | 2 | high | - |
| TASK-0512 | Implementar checker PCI Req 5 (protecao contra malware) | 3 | high | - |
| TASK-0513 | Implementar checker PCI Req 6 (desenvolvimento de software seguro / SAST) | 3 | high | - |
| TASK-0514 | Implementar checker PCI Req 7 (controle de acesso need-to-know) | 2 | high | - |
| TASK-0515 | Criar pipeline CI/CD GitLab: build + test + deploy automatizado em hml | 3 | high | - |
| TASK-0516 | Integrar pci-compliance-automation no pipeline CI/CD | 2 | high | - |
| TASK-0517 | Documentar modulos ALB, NLB, autoscaling, Route53 (README + exemplos) | 3 | medium | - |
| TASK-0518 | Configurar alertas Zabbix para eventos de seguranca (falhas auth, portscan) | 3 | medium | - |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q2-08: Conformidade PCI — contribui para KR-01, KR-02, KR-03
- OKR-2026-Q2-09: IaC e CI/CD — contribui para KR-02, KR-03

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
