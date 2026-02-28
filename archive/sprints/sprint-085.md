---
id: sprint-085
title: "Sprint 85 - Componentes do Dashboard Config-Driven"
project: kanbania
goal: "Refatorar os 6 componentes e camadas de dados do dashboard para consumirem useConfig() em vez de constantes hardcoded"
start_date: "2026-06-03"
end_date: "2026-06-16"
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

Aplicar o useConfig() hook a todos os componentes React que ainda leem constantes hardcoded. Refatorar reader.ts e as API routes para serem config-driven. Validar que o dashboard compila e renderiza corretamente com qualquer config.yaml customizado.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0612 | Refatorar kanban-board.tsx — colunas de useConfig() | 3 | high |
| TASK-0613 | Refatorar kanban-column.tsx — cores e labels de useConfig() | 2 | high |
| TASK-0614 | Refatorar agent-status-bar.tsx — agentes de useConfig() | 3 | high |
| TASK-0615 | Refatorar stats-overview.tsx — column color map | 2 | medium |
| TASK-0616 | Refatorar project-summary-card.tsx — column maps | 2 | medium |
| TASK-0617 | Refatorar sprint-tasks.tsx — statusOrder | 1 | medium |
| TASK-0618 | Refatorar reader.ts — column arrays config-driven | 3 | high |
| TASK-0619 | Refatorar use-board.ts — empty init dinamico | 1 | medium |
| TASK-0620 | Refatorar api/projects/stats/route.ts — init dinamico | 1 | medium |
| TASK-0621 | Validacao final — grep zero e npm run build | 2 | high |

**Total de Pontos**: 20 / 21

## OKRs Vinculados

- OKR-2026-Q2-03: Dashboard config-driven — contribui para KR-03 e KR-04

## Notas de Execucao

- Todos dependem de TASK-0606 (useConfig()) concluido no sprint-084
- TASK-0612 a TASK-0620 podem rodar em paralelo
- TASK-0621 depende de todos os anteriores (nao paralelizavel)
- Criterio de saida do sprint: npm run build passa + grep -r 'carlosfarah' dashboard/src/ = zero

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 20
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
