---
id: sprint-091
title: "Sprint 91 - Observabilidade Fases 3-4 + Config Foundation Continuacao"
project: kanbania
goal: "Entregar AgentSwimLane em tempo real no dashboard e solidificar base do config-driven"
start_date: "2026-03-13"
end_date: "2026-03-26"
status: pending
capacity: 21
created_by: claude-code
okrs:
  - OKR-2026-Q1-06
  - OKR-2026-Q2-01
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-27T12:00:00-03:00"
---

## Objetivo

Completar a observabilidade visual com componente AgentSwimLane no dashboard e corrigir
a expansao do tipo WSMessage para union discriminada sem regressoes.

Continuar Config Foundation com workflow, testes e primeiras migracoes de scripts.

## Tasks

### Observabilidade — Fase 3 (TypeScript)
- TASK-0668: Adicionar HookEvent, HitlRequest ao types.ts
- TASK-0669: Expandir WSMessage para union discriminada
- TASK-0670: Corrigir type guards nos componentes + build validation

### Observabilidade — Fase 4 (AgentSwimLane)
- TASK-0671: Criar use-hook-events.ts composable
- TASK-0672: Criar EventChip component
- TASK-0673: Criar AgentSwimLane.tsx componente completo
- TASK-0674: Integrar AgentSwimLane na pagina /board/[project]
- TASK-0675: Build + deploy + teste end-to-end completo

### Documentacao e Infra
- TASK-0676: Documentar observabilidade no DASHBOARD_OPS.md
- TASK-0677: Adicionar rotacao de logs hooks-events.jsonl

### Config Foundation continuacao
- TASK-0296: Testar config.sh — unit tests
- TASK-0297: Migrar kanban-sync-check.sh para config-driven
