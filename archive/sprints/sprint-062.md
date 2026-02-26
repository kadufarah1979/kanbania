---
id: sprint-062
title: "ConsoleAI FinOps Integration: Dashboard Unificado"
goal: "Entregar dashboard unificado (inventario + custo por tenant), pagina FinOps por tenant e custo visivel no workflow de aprovacao"
project: consoleai
start_date: "2026-03-09"
end_date: "2026-03-22"
status: completed
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q1-03
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-23T10:37:00-03:00"
  - agent: "claude-code"
    action: archive
    date: "2026-02-24T00:00:00-03:00"
---

## Objetivo do Sprint

Construir o dashboard unificado visivel por tenant com inventario AWS e custo mensal lado a lado, adicionar contexto de custo no fluxo de aprovacao de solicitacoes e criar a page FinOps contextualizada por OU.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0451 | Criar pages/unified_dashboard.py com inventario + custo por tenant | 3 | critical | - |
| TASK-0452 | Graficos de custo mensal por OU no unified_dashboard | 2 | high | - |
| TASK-0453 | Widget de custo em cards EC2/ELB no inventario | 3 | high | - |
| TASK-0454 | Exibir custo do recurso no fluxo de aprovacao de solicitacoes | 3 | high | - |
| TASK-0455 | Criar pages/finops_tenant.py com projecoes e cenarios SP por OU | 3 | high | - |
| TASK-0456 | Menu lateral unificado e design system consistente | 2 | medium | - |
| TASK-0457 | Remover acesso anonimo em pages legadas fase1/2/3 | 2 | critical | - |
| TASK-0458 | Testes de integracao dashboard + cost_service | 3 | high | - |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q1-03: Integrar FinOps e gestao operacional em plataforma multi-tenant unificada — contribui para KR-02, KR-03, KR-04

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
-

### O que pode melhorar
-

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues**: 21
- **Velocidade**: 21 pts/sprint
- **Taxa de conclusao**: 100%
