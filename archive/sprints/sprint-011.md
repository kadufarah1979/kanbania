---
id: sprint-011
title: "AquaBook Sprint 11 — Full Polish: pt-BR, UX Fixes & Equipment Setup"
goal: "Produto pronto para mostrar: traducao completa pt-BR, fixes de UX (EmptyState/AlertList) e setup de equipamentos do aquario"
start_date: "2026-03-16"
end_date: "2026-03-30"
status: completed
project: aquario
capacity: 25
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-15T14:10:00-03:00"
---

## Objetivo do Sprint

Sprint de polimento: traduzir toda a interface para pt-BR, corrigir issues de UX (EmptyState compacto, AlertList configuravel) e implementar o modulo de Setup e Equipamentos do aquario (dimensoes, sump, substrato, inventario de equipamentos com categorias, garantias e investimento).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0092 | Fechar Sprint 10 + criar Sprint 11 | 1 | critical | claude-code |
| TASK-0088 | Traduzir dashboard para pt-BR | 2 | high | — |
| TASK-0089 | Traduzir /parameters para pt-BR | 3 | high | — |
| TASK-0090 | Traduzir /readings/new para pt-BR | 3 | high | — |
| TASK-0091 | Traduzir /readings/history para pt-BR | 3 | high | — |
| TASK-0093 | EmptyState compact variant (size=sm) | 1 | medium | — |
| TASK-0094 | AlertList configurable empty description | 1 | medium | — |
| TASK-0095 | Equipment: schema migration | 2 | critical | — |
| TASK-0096 | Equipment: models + schemas + seed categories | 2 | high | — |
| TASK-0097 | Equipment: service layer + API endpoints | 3 | high | — |
| TASK-0098 | Equipment frontend: setup tab | 2 | medium | — |
| TASK-0099 | Equipment frontend: equipment list + CRUD | 3 | medium | — |

**Total de Pontos**: 25 + 1 bonus = 26

## Dependencias

```
TASK-0092 (housekeeping)
    |
    ├-> TASK-0088 (dashboard pt-BR)     ─┐
    ├-> TASK-0089 (parameters pt-BR)     ├─ independentes entre si
    ├-> TASK-0090 (readings/new pt-BR)   │
    ├-> TASK-0091 (readings/history pt-BR)┘
    |
    ├-> TASK-0093 (EmptyState compact)   ─ independente
    ├-> TASK-0094 (AlertList empty desc) ─ independente
    |
    └-> TASK-0095 (equipment migration)
          |
          └-> TASK-0096 (equipment models + schemas + seed)
                |
                └-> TASK-0097 (equipment service + API)
                      |
                      ├-> TASK-0098 (setup tab frontend)
                      |
                      └-> TASK-0099 (equipment list + CRUD frontend)
```

## OKRs Vinculados

- OKR-2026-Q1-01: Contribui para KR-04 (fases do MVP) e qualidade geral do produto
