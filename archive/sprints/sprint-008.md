---
id: sprint-008
title: "AquaBook Sprint 8 — Marketplace MVP Foundation"
goal: "Entregar fundacao do marketplace: schema, listings CRUD, busca/filtros, categorias, pagina de detalhe, e sidebar link"
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
    date: "2026-02-15T04:30:00-03:00"
---

## Objetivo do Sprint

Entregar a fundacao do Marketplace (Fase 7): schema de banco, models, service layer com CRUD e busca, endpoints API, frontend com listagem, busca/filtros, criacao de anuncio (wizard), pagina de detalhe, e link no sidebar.

Bonus: EmptyState compact, CSV export (ja implementado), meus anuncios + E2E.

**Ao final deste sprint:** Usuario pode criar anuncios, buscar/filtrar, ver detalhes. Base pronta para Q&A/ofertas na Sprint 9.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0050 | Fechar Sprint 7 + arquivar tasks awsfin | 1 | critical | claude-code |
| TASK-0051 | Marketplace schema + migration | 3 | critical | — |
| TASK-0052 | Marketplace models + schemas Pydantic | 2 | high | — |
| TASK-0053 | Listing service (CRUD + busca + validacao) | 3 | high | — |
| TASK-0054 | Marketplace API endpoints | 3 | high | — |
| TASK-0055 | Marketplace store + API client | 2 | high | — |
| TASK-0056 | Pagina principal do marketplace + busca | 3 | high | — |
| TASK-0057 | Criar anuncio (wizard multi-step) | 3 | high | — |
| TASK-0058 | Pagina de detalhe do anuncio | 2 | medium | — |
| TASK-0059 | EmptyState variante compact | 1 | low | — |
| TASK-0060 | CSV export para leituras | 1 | low | — |
| TASK-0061 | Meus anuncios + testes E2E marketplace | 1 | low | — |

**Total de Pontos**: 25 / 25

## Dependencias

```
TASK-0050 → TASK-0051 → TASK-0052 → TASK-0053 → TASK-0054
                                                      ↓
                                                 TASK-0055
                                                   ↓    ↓
                                             TASK-0056  TASK-0057
                                                ↓          ↓
                                           TASK-0058  TASK-0061

TASK-0059, TASK-0060 — independentes
```

## OKRs Vinculados

- OKR-2026-Q1-01: Contribui para KR-05 (marketplace foundation)

## Retrospectiva

### O que foi bem
- Toda a fundacao do Marketplace entregue em uma unica sprint (schema, models, service, API, frontend completo)
- Pipeline kanban funcionou end-to-end com QA automatizado do codex
- 129 testes backend passando, TypeScript compilando sem erros
- E2E test cobrindo fluxo completo de criar anuncio + buscar
- CSV export com tratamento correto de campos com virgula (pt-BR dates)
- Wizard multi-step reutilizou pattern do aquarium-wizard com sucesso

### O que pode melhorar
- Concurrent codex reviews causaram falsos positivos no backend gate (resolvido com flock)
- Codex sobrescrevia entradas `acted_by: claude-code approved` ao editar cards — exigiu multiplas re-adicoes
- Codex interpretou "129 passed" como "129 errors" em uma rodada — gate script precisa de output mais claro
- Nomenclatura `size_cm` vs `size` divergiu entre backend schema e acceptance criteria — alinhar terminologia antes de implementar

### Metricas
- **Pontos planejados**: 25
- **Pontos entregues**: 25
- **Velocidade**: 25 pts/sprint
- **Taxa de conclusao**: 100% (12/12 tasks)
