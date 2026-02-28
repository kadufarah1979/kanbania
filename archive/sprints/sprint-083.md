---
id: sprint-083
title: "Sprint 83 - Trigger Scripts e Sync Config-Driven"
project: kanbania
goal: "Renomear trigger-codex-*.sh para trigger-agent-*.sh e refatorar scripts de sync e pre-review"
start_date: "2026-05-06"
end_date: "2026-05-19"
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

Renomear e parametrizar os 4 scripts de trigger (trigger-codex-review/fix/next e sync-codex-worktree), refatorar generate-task-instructions.sh e pre-review-check.sh, e atualizar todas as referencias. Ao final, os 3 scripts mais complexos do sistema serao config-driven.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0594 | Renomear trigger-codex-review.sh → trigger-agent-review.sh | 3 | high |
| TASK-0595 | Renomear trigger-codex-fix.sh → trigger-agent-fix.sh | 3 | high |
| TASK-0596 | Renomear trigger-codex-next.sh → trigger-agent-next.sh | 3 | high |
| TASK-0597 | Renomear sync-codex-worktree.sh → sync-agent-worktree.sh | 3 | high |
| TASK-0598 | Refatorar generate-task-instructions.sh | 3 | high |
| TASK-0599 | Refatorar pre-review-check.sh para gates dinamicos | 3 | high |
| TASK-0600 | Atualizar referencias nos scripts invocadores | 2 | high |

**Total de Pontos**: 20 / 21

## OKRs Vinculados

- OKR-2026-Q2-02: Scripts 100% config-driven — contribui para KR-03 e KR-04

## Notas de Execucao

- TASK-0594 deve ser concluida antes de TASK-0600
- TASK-0594 a TASK-0599 podem rodar em paralelo
- TASK-0600 depende de TASK-0594, 0595, 0596, 0597
- TASK-0601 (validacao final grep) foi movida para sprint-088 para ser a ultima validacao global
- Apos este sprint: OKR-2026-Q2-02 deve estar completo (KR-04: grep zero)

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
