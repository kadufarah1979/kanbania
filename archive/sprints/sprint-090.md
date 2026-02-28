---
id: sprint-090
title: "Sprint 90 - Observabilidade Fases 1-2 + Config Foundation"
project: kanbania
goal: "Ativar hooks Python de observabilidade e endpoint server.ts para captura de eventos em tempo real"
start_date: "2026-02-27"
end_date: "2026-03-12"
status: completed
capacity: 21
created_by: claude-code
okrs:
  - OKR-2026-Q1-06
  - OKR-2026-Q2-01
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-27T12:00:00-03:00"
  - agent: claude-code
    action: started
    date: "2026-02-27T12:00:00-03:00"
---

## Objetivo

Implementar as duas primeiras fases da observabilidade de agentes:
- Fase 1: hooks Python (.claude/hooks/) capturando PreToolUse, PostToolUse, SessionStart/End, Stop
- Fase 2: endpoint POST /events/hook no server.ts com persistencia JSONL e broadcast WebSocket

Paralelamente, iniciar Config Foundation: expandir config.yaml e criar config.local.yaml.

## Tasks

### Observabilidade — Fase 1 (Hooks Python)
- TASK-0661: Criar _shared.py — modulo utilitario dos hooks
- TASK-0662: Criar pre_tool_use.py e post_tool_use.py
- TASK-0663: Criar session_start.py, session_end.py e stop.py
- TASK-0664: Configurar hooks no .claude/settings.json

### Observabilidade — Fase 2 (server.ts)
- TASK-0665: Refatorar server.ts — mini-router handleRequest
- TASK-0666: Implementar handleHookEvent + POST /events/hook
- TASK-0667: Broadcast WS de hook events + teste de integracao

### Config Foundation (backlog existente)
- TASK-0290: Expandir config.yaml — secao system
- TASK-0291: Expandir config.yaml — secao workflow
- TASK-0292: Expandir config.yaml — secao projects
- TASK-0293: Expandir config.yaml — secao agents com campos extras
- TASK-0295: Criar config.local.yaml
