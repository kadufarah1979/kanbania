---
id: sprint-012
title: "Sprint 12 — Regression Testing: Full System Validation"
goal: "Validar que todo o sistema funciona corretamente apos restart completo do ambiente e implementacao da Sprint 11"
start_date: "2026-02-15"
end_date: "2026-02-22"
status: completed
project: aquario
capacity: 15
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-15T16:00:00-03:00"
---

## Objetivo do Sprint

Sprint de teste de regressao: validar que todas as funcionalidades do sistema continuam operacionais apos restart completo do ambiente Docker. Cobrir backend (API endpoints, auth, CRUD, alerts, equipment), frontend (todas as paginas carregam, formularios funcionam) e infraestrutura (containers, DB migrations, MQTT, WebSocket).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0100 | Regression: infraestrutura (containers, DB, MQTT) | 1 | critical | — |
| TASK-0101 | Regression: auth flow (register, login, JWT) | 1 | critical | — |
| TASK-0102 | Regression: aquariums CRUD completo | 2 | high | — |
| TASK-0103 | Regression: devices CRUD + heartbeat | 1 | high | — |
| TASK-0104 | Regression: readings (manual + history + latest) | 2 | high | — |
| TASK-0105 | Regression: dashboard overview + cards | 2 | high | — |
| TASK-0106 | Regression: alerts (rules, events, acknowledge) | 2 | high | — |
| TASK-0107 | Regression: parameters (ranges, validation) | 1 | medium | — |
| TASK-0108 | Regression: equipment (categories, CRUD, setup, maintenance) | 2 | high | — |
| TASK-0109 | Regression: marketplace (listings, offers, transactions) | 2 | medium | — |
| TASK-0110 | Regression: frontend pages (todas as rotas carregam) | 2 | high | — |

**Total de Pontos**: 18

## Dependencias

```
TASK-0100 (infra)
    |
    └-> TASK-0101 (auth) — precisa de DB e backend rodando
          |
          ├-> TASK-0102 (aquariums)
          ├-> TASK-0103 (devices)
          ├-> TASK-0104 (readings)
          ├-> TASK-0105 (dashboard)
          ├-> TASK-0106 (alerts)
          ├-> TASK-0107 (parameters)
          ├-> TASK-0108 (equipment)
          ├-> TASK-0109 (marketplace)
          └-> TASK-0110 (frontend)
```

## Criterios de Aceite da Sprint

- [ ] Todos os containers healthy apos `make down && make up`
- [ ] 190 testes backend passam sem falhas
- [ ] Todas as APIs respondem corretamente com dados validos
- [ ] Todas as paginas do frontend carregam sem erros de console
- [ ] Nenhuma regressao identificada

## OKRs Vinculados

- OKR-2026-Q1-01: Qualidade e estabilidade do MVP
