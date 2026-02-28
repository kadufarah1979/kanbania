---
id: sprint-009
title: "Sprint 9 — Testes E2E + Polimento + Publicacao"
project: aquario
subproject: app-android
goal: "Detox E2E, RNTL coverage >= 70%, Sentry, OTA, i18n, Acessibilidade e Play Store submit"
start_date: "2026-06-09"
end_date: "2026-06-22"
status: pending
capacity: 18
created_by: "claude-code"
okrs:
  - OKR-2026-Q3-04
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-28T14:00:00-03:00"
---

## Objetivo do Sprint

Sprint de qualidade e publicacao: suites de testes automatizados (Detox E2E + RNTL),
integracao com Sentry para monitoramento de crashes, OTA Updates, internacionalizacao
completa em pt-BR, ajustes de acessibilidade e submissao final na Play Store.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0712 | Detox E2E — login + cadastro aquario + alerta + checkout | 3 | high |
| TASK-0713 | RNTL unit tests shared components (cobertura >= 70%) | 3 | high |
| TASK-0714 | Performance (FlashList migration + bundle size audit) | 2 | medium |
| TASK-0715 | Sentry crash reporting + sourcemaps EAS | 2 | high |
| TASK-0716 | expo-updates OTA (canal production, rollback) | 2 | medium |
| TASK-0717 | Internacionalizacao pt-BR completa (todas strings) | 2 | medium |
| TASK-0718 | Acessibilidade WCAG basica (contrast, touch targets, labels) | 2 | medium |
| TASK-0719 | Play Store submit — internal track -> production (screenshots, review) | 2 | critical |

**Total de Pontos**: 18 / 18

## OKRs Vinculados

- OKR-2026-Q3-04: KR-03 (cobertura testes), KR-04 (crash rate)
- OKR-2026-Q2-11: KR-02 (app aprovado Play Store)

## Notas de Execucao

- TASK-0719 depende de TASK-0696 (sprint-006) e TASK-0695 (sprint-006)
- TASK-0712 e TASK-0713 podem rodar em paralelo
- **MILESTONE**: ao final, app publicado na Play Store (internal -> production)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 18
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
