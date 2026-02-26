---
id: sprint-061
title: "Refactoring: Debito Tecnico Dashboard Kanbania"
goal: "Corrigir WebSocket, eliminar duplicacoes, adicionar cache no reader e consolidar componentes"
project: kanbania
start_date: "2026-02-22"
end_date: "2026-03-08"
status: completed
capacity: 21
created_by: "claude-code"
okrs: []
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-22T12:30:00-03:00"
  - agent: "codex"
    action: archive
    date: "2026-02-22T22:44:25-03:00"
---

## Objetivo do Sprint

Reduzir debito tecnico do dashboard Kanbania identificado na analise de qualidade.
Foco em: corrigir WebSocket, eliminar duplicacoes de codigo, melhorar performance
com cache no reader, e consolidar componentes/hooks.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0428 | Corrigir porta WebSocket (8788 vs 8766) | 1 | critical | |
| TASK-0429 | Extrair funcao computeSprintStats() para eliminar duplicacao em rotas API | 2 | high | |
| TASK-0430 | Implementar cache em memoria com TTL no reader.ts | 3 | high | |
| TASK-0431 | Criar WebSocket Context Provider unico | 2 | high | |
| TASK-0432 | Unificar SprintBanner e ActiveSprintBanner em componente unico | 2 | high | |
| TASK-0433 | Consolidar constantes duplicadas (STATUS_COLORS, AGENT_COLORS, interfaces) | 2 | medium | |
| TASK-0434 | Implementar leitura reversa eficiente do activity.jsonl | 2 | medium | |
| TASK-0435 | Parametrizar projeto no kb.sh e pre-review-check.sh | 1 | medium | |
| TASK-0436 | Corrigir violacoes de schema no kb.sh (campo status, claim de todo) | 1 | medium | |
| TASK-0437 | Polling condicional nos hooks (so se WS desconectado) | 2 | medium | |
| TASK-0438 | Remover fallback para campo proibido "points" no reader | 1 | low | |
| TASK-0439 | Padronizar idioma do dashboard para pt-BR | 2 | low | |
| TASK-0440 | Hook chokidar para encerramento automatico de sprint | 3 | medium | |

**Total de Pontos**: 24 / 21

## Dependencias entre Tasks

- TASK-0428 (WS porta) → TASK-0431 (WS Provider) → TASK-0437 (polling condicional)
- TASK-0429 (computeSprintStats) e TASK-0430 (cache reader) sao independentes
- TASK-0432 (SprintBanner) depende de TASK-0433 (constantes consolidadas)
- TASK-0440 (hook chokidar) depende de TASK-0428 (WS porta corrigida)

## Retrospectiva

{Preenchido ao final do sprint}
