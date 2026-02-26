---
id: sprint-016
title: "Sprint 16 — Testes Frontend Livestock"
goal: "Cobertura de testes unitarios para o modulo Livestock frontend: store, componentes, dialogos e paginas"
start_date: "2026-02-16"
end_date: "2026-03-02"
status: completed
project: aquario
capacity: 18
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-16T03:00:00-03:00"
---

## Objetivo do Sprint

Implementar suite de testes unitarios para todo o modulo Livestock frontend (sprint-015). Seguir os padroes existentes: Vitest + Testing Library + userEvent. Cobrir store (Zustand), componentes de UI, dialogos (formularios) e paginas.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0127 | Teste: livestock-store (Zustand) | 3 | critical | — |
| TASK-0128 | Teste: species-search + compatibility-alerts | 3 | high | — |
| TASK-0129 | Teste: livestock-add-dialog | 3 | high | — |
| TASK-0130 | Teste: livestock-edit-dialog + deceased-dialog + removal-dialog | 3 | high | — |
| TASK-0131 | Teste: livestock-timeline + symptom-picker | 2 | medium | — |
| TASK-0132 | Teste: coral-growth-chart + coral-frag-dialog | 2 | medium | — |
| TASK-0133 | Teste: livestock/page.tsx (inventory com tabs e actions) | 2 | medium | — |

**Total de Pontos**: 18

## Dependencias

```
TASK-0127 (store)
    |
    +-> TASK-0128 (species-search + compatibility)
    |
    +-> TASK-0129 (add dialog)
    |
    +-> TASK-0130 (edit + deceased + removal dialogs)
    |
    +-> TASK-0131 (timeline + symptom-picker)
    |
    +-> TASK-0132 (coral growth + frag)
    |
    +-> TASK-0133 (inventory page)
```

## Padroes a Seguir

- Vitest: `describe`/`it`/`expect`, `vi.mock()`, `vi.fn()`
- Testing Library: `render`, `screen`, `waitFor`
- userEvent: `userEvent.setup()` para interacoes
- Zustand: `getState()` para acesso direto ao store
- Factory functions: `makeLivestock()`, `makeEvent()` para dados de teste
- Mocks: `vi.mock("@/lib/api/livestock")` para API client

## Criterios de Aceite da Sprint

- [ ] `npm run test` passa sem erros
- [ ] Store: initial state, fetchLivestock, fetchEvents, fetchGrowthHistory, add/update/remove, error handling
- [ ] SpeciesSearch: busca debounced, selecao de especie, especie customizada
- [ ] CompatibilityAlerts: renderiza alertas por nivel (compatible/caution/incompatible)
- [ ] LivestockAddDialog: abre/fecha, preenche form, submete, mostra erro
- [ ] LivestockEditDialog: carrega dados, submete alteracoes
- [ ] DeceasedDialog: causa, sintomas, ammonia warning, submit
- [ ] RemovalDialog: motivo, destino, submit
- [ ] Timeline: renderiza eventos, icones corretos, ordena por data
- [ ] SymptomPicker: toggle sintomas, agrupamento
- [ ] CoralGrowthChart: renderiza chart/empty state, dialog de medida
- [ ] CoralFragDialog: submit com fragmentos
- [ ] Inventory page: tabs com contagem, filtro, card actions, empty state
