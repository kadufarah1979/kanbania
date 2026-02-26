---
id: sprint-009
title: "AquaBook Sprint 9 — Marketplace Q&A, Offers, Edit & Status"
goal: "Entregar interacoes do marketplace: Q&A publico, ofertas com contraproposta (3 rounds), edicao de anuncios e pause/reactivate"
start_date: "2026-02-16"
end_date: "2026-03-02"
status: completed
project: aquario
capacity: 25
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-15T20:00:00-03:00"
---

## Objetivo do Sprint

Entregar as interacoes do marketplace: Q&A publico (perguntas/respostas), ofertas com contraproposta (3 rounds), edicao de anuncios e gerenciamento de status (pausar/reativar). Transacoes, pagamento e disputas ficam para Sprint 10+.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0062 | Fechar Sprint 8 + criar Sprint 9 | 1 | critical | claude-code |
| TASK-0063 | Q&A schema + migration | 2 | critical | — |
| TASK-0064 | Q&A models + schemas Pydantic | 2 | high | — |
| TASK-0065 | Q&A service layer | 3 | high | — |
| TASK-0066 | Q&A API endpoints | 2 | high | — |
| TASK-0067 | Q&A frontend — secao de perguntas | 2 | high | — |
| TASK-0068 | Offers schema + migration | 2 | critical | — |
| TASK-0069 | Offers models + schemas + service | 3 | high | — |
| TASK-0070 | Offers API endpoints | 2 | high | — |
| TASK-0071 | Offers frontend — dialog + minhas ofertas | 3 | high | — |
| TASK-0072 | Pagina de edicao de anuncio | 2 | medium | — |
| TASK-0073 | Gerenciamento de status (pausar/reativar) | 1 | medium | — |
| TASK-0074 | pt-BR audit + EmptyState/AlertList fix | 2 | low | — |

**Total de Pontos**: 25 + 2 bonus = 27

## Dependencias

```
TASK-0062 (housekeeping)
    |-> TASK-0063 (Q&A schema) -> TASK-0064 (Q&A models) -> TASK-0065 (Q&A service) -> TASK-0066 (Q&A API)
    |                                                                                      |
    |                                                                                 TASK-0067 (Q&A frontend)
    |
    |-> TASK-0068 (Offers schema) -> TASK-0069 (Offers models+service) -> TASK-0070 (Offers API)
    |                                                                          |
    |                                                                     TASK-0071 (Offers frontend)
    |
    |-> TASK-0072 (Edit listing)
    |
    |-> TASK-0073 (Status management)

TASK-0074 (pt-BR audit) — independente
```

## OKRs Vinculados

- OKR-2026-Q1-01: Contribui para KR-05 (marketplace interactions)
