---
id: sprint-082
title: "Sprint 82 - kb.sh e board-monitor.sh Config-Driven"
project: kanbania
goal: "Refatorar os 2 scripts mais complexos: kb.sh (650 linhas) e board-monitor.sh (199 linhas)"
start_date: "2026-04-22"
end_date: "2026-05-05"
status: done
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-02
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-25T10:00:00-03:00"
---

## Objetivo do Sprint

Refatorar os 2 scripts centrais do sistema. kb.sh tem 5 aspectos a migrar (paths, agent, reviewers, colunas, project). board-monitor.sh tem 3 aspectos (paths, agent names, notifications). Ao final, nenhum desses scripts deve conter paths pessoais ou nomes de agentes hardcoded.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0586 | Refatorar kb.sh — substituir KANBAN_DIR hardcoded | 3 | high |
| TASK-0587 | Refatorar kb.sh — AGENT dinamico via config | 2 | high |
| TASK-0588 | Refatorar kb.sh — reviewers dinamicos via get_reviewers() | 3 | high |
| TASK-0589 | Refatorar kb.sh — colunas dinamicas via get_columns() | 3 | high |
| TASK-0590 | Refatorar kb.sh — project dinamico via config | 2 | high |
| TASK-0591 | Refatorar board-monitor.sh — paths e diretorios | 3 | high |
| TASK-0592 | Refatorar board-monitor.sh — agent names via get_agent_role() | 3 | high |
| TASK-0593 | Refatorar board-monitor.sh — notifications via notify() | 2 | high |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q2-02: Scripts 100% config-driven — contribui para KR-01 e KR-02

## Notas de Execucao

- Todos dependem de TASK-0572 (sprint-080) concluido
- TASK-0586 a TASK-0590 (kb.sh) podem rodar em paralelo entre si
- TASK-0591 a TASK-0593 (board-monitor) podem rodar em paralelo entre si
- TASK-0588 tem depends_on TASK-0593 — executar TASK-0593 antes de finalizar TASK-0588
- TASK-0588 tambem dependera de TASK-0594 (sprint-083) para troca do trigger script name — pode ser concluida parcialmente e revisada no sprint-083

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
