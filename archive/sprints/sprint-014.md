---
id: sprint-014
title: "Sprint 14 — Inventario de Vida (Livestock) - Backend"
goal: "Implementar o modulo de inventario de vida (fauna e flora) no backend: models, schemas, services, API e seed de categorias/especies"
start_date: "2026-02-15"
end_date: "2026-03-01"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-15T22:30:00-03:00"
---

## Objetivo do Sprint

Implementar o modulo completo de Inventario de Vida (Livestock) conforme documentado em `docs/dev/LIVESTOCK.md`. Este sprint foca no **backend** (models, schemas, services, API endpoints) e no **seed de dados** (categorias + especies iniciais). O frontend sera implementado na sprint seguinte.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0115 | Livestock: models e migration (livestock_categories, species, aquarium_livestock, livestock_events) | 5 | critical | — |
| TASK-0116 | Livestock: schemas Pydantic (request/response para todas as entidades) | 3 | high | — |
| TASK-0117 | Livestock: seed de categorias e especies iniciais (50 peixes marinhos + 30 corais) | 3 | high | — |
| TASK-0118 | Livestock: service layer (CRUD livestock, eventos, obito, remocao, crescimento) | 5 | high | — |
| TASK-0119 | Livestock: API endpoints (router com todos os endpoints documentados) | 3 | high | — |
| TASK-0120 | Livestock: verificacao de compatibilidade entre especies | 2 | medium | — |

**Total de Pontos**: 21

## Dependencias

```
TASK-0115 (models + migration)
    |
    +-> TASK-0116 (schemas)
    |       |
    |       +-> TASK-0117 (seed dados)
    |       |
    |       +-> TASK-0118 (services)
    |               |
    |               +-> TASK-0119 (API endpoints)
    |               |
    |               +-> TASK-0120 (compatibilidade)
```

## Referencia

- Documento completo: `docs/dev/LIVESTOCK.md`
- Secoes relevantes: modelo de dados (sec 2), categorias (sec 3), sintomas (sec 4), compatibilidade (sec 5), API (sec 9)

## Criterios de Aceite da Sprint

- [ ] 4 tabelas criadas via Alembic migration (livestock_categories, species, aquarium_livestock, livestock_events)
- [ ] Seed com 20 categorias, 50+ peixes marinhos e 30+ corais
- [ ] CRUD completo de livestock por aquario
- [ ] Registro de obito com snapshot de parametros
- [ ] Registro de remocao com motivo e destino
- [ ] Registro de crescimento para corais
- [ ] Verificacao de compatibilidade ao adicionar especie
- [ ] Todos os endpoints com testes
