---
id: sprint-084
title: "Sprint 84 - Dashboard Types, Config Reader e API"
project: kanbania
goal: "Criar a fundacao config-driven do dashboard: types widened, config-reader.ts, /api/config e constants refatorados"
start_date: "2026-05-20"
end_date: "2026-06-02"
status: done
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-03
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-25T10:00:00-03:00"
---

## Objetivo do Sprint

Transformar a camada de dados do dashboard para ser config-driven. Widen os union types para string, criar config-reader.ts que le config.yaml, expor /api/config endpoint, criar hook useConfig() e refatorar todo o constants.ts para ser derivado do config em vez de literals hardcoded.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0602 | Widen BoardColumn type para string | 2 | high |
| TASK-0603 | Widen AgentId type para string | 1 | high |
| TASK-0604 | Criar config-reader.ts | 3 | high |
| TASK-0605 | Criar endpoint GET /api/config | 2 | high |
| TASK-0606 | Criar hook useConfig() | 2 | high |
| TASK-0607 | Refatorar constants.ts — KANBAN_ROOT | 1 | high |
| TASK-0608 | Refatorar constants.ts — BOARD_COLUMNS | 3 | high |
| TASK-0609 | Refatorar constants.ts — COLUMN_BG e COLUMN_HEADER_COLOR | 3 | medium |
| TASK-0610 | Refatorar constants.ts — AGENT_COLORS | 2 | medium |
| TASK-0611 | Refatorar constants.ts — PATHS | 2 | high |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q2-03: Dashboard config-driven — contribui para KR-01 e KR-02

## Notas de Execucao

- TASK-0602 e TASK-0603 (type widening) sao independentes, podem comecar imediatamente
- TASK-0604 (config-reader) requer config.yaml expandido (sprint-080 concluido)
- TASK-0605 depende de TASK-0604; TASK-0606 depende de TASK-0605
- TASK-0608 a TASK-0611 dependem de TASK-0604
- TASK-0609 depende de TASK-0608
- Este sprint pode rodar EM PARALELO com sprint-082 e sprint-083 (scripts sao independentes do dashboard)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
