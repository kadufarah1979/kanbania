---
id: sprint-081
title: "Sprint 81 - Scripts Simples Migrados"
project: kanbania
goal: "Migrar os 4 scripts mais simples para config-driven e validar a fundacao em producao"
start_date: "2026-04-08"
end_date: "2026-04-21"
status: done
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-01
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-25T10:00:00-03:00"
---

## Objetivo do Sprint

Migrar os 4 scripts de menor complexidade (kanban-sync-check, update-agent-status, agent-heartbeat, kanban-lint) para consumirem config.sh. Validar que a fundacao criada no sprint-080 funciona em producao. Documentar a API do config.sh.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0580 | Migrar kanban-sync-check.sh | 2 | high |
| TASK-0581 | Migrar update-agent-status.sh | 1 | high |
| TASK-0582 | Migrar agent-heartbeat.sh | 1 | high |
| TASK-0583 | Migrar kanban-lint.sh | 3 | high |
| TASK-0584 | Validar fluxo completo pos-migracao | 3 | high |
| TASK-0585 | Documentar API do config.sh com comentarios inline | 3 | medium |

**Total de Pontos**: 13 / 21 (8 SP buffer — sprint de consolidacao)

## OKRs Vinculados

- OKR-2026-Q2-01: Criar fundacao de configuracao e migrar scripts simples — contribui para KR-03

## Notas de Execucao

- Todos os tasks dependem de TASK-0572 (sprint-080) estar concluido
- TASK-0580 a TASK-0583 podem rodar em paralelo
- TASK-0584 depende de todas as migracoes (0580-0583)
- TASK-0585 pode rodar em paralelo com as migracoes

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 13
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
