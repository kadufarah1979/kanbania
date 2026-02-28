---
id: sprint-042
title: "Sprint 42 - Trigger Scripts + Sync Generico"
project: kanbania
goal: "Renomear trigger-codex-* para trigger-agent-*, parametrizar com --agent e --project"
start_date: "2026-04-18"
end_date: "2026-05-02"
status: completed
capacity: 28
created_by: claude-code
okrs: [OKR-2026-Q2-02]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-21T22:00:00-03:00"
---

## Objetivo do Sprint

Renomear trigger-codex-* para trigger-agent-*, parametrizar com --agent e --project

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0311 | Renomear trigger-codex-review.sh para trigger-agent-review.sh | 5 | critical | - |
| TASK-0312 | Renomear trigger-codex-fix.sh para trigger-agent-fix.sh | 5 | critical | - |
| TASK-0313 | Renomear trigger-codex-next.sh para trigger-agent-next.sh | 3 | high | - |
| TASK-0314 | Renomear sync-codex-worktree.sh para sync-agent-worktree.sh | 3 | high | - |
| TASK-0315 | Refatorar generate-task-instructions.sh | 3 | high | - |
| TASK-0316 | Refatorar pre-review-check.sh | 5 | high | - |
| TASK-0317 | Atualizar refs nos scripts que invocam os renomeados | 2 | high | - |
| TASK-0318 | Validacao final - grep -r scripts | 2 | medium | - |

**Total de Pontos**: 28

## OKRs Vinculados

- OKR-2026-Q2-02: Tornar Kanbania generico para open-source

## Retrospectiva

Scripts ja renomeados (trigger-agent-*, sync-agent-worktree) e refatorados. Zero refs aos nomes antigos. TASK-0311..0318 auto-aprovados.
