---
id: sprint-036
title: "Sprint 36 - Estabilizacao e Observabilidade em Producao"
project: aquario
goal: "Estabilizar producao com observabilidade (Sentry + source maps), validar deploy de filter media e revalidar seguranca HTTPS"
start_date: "2026-02-20"
end_date: "2026-03-06"
status: completed
capacity: 21
created_by: claude-code
okrs: []
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-20T21:30:00-03:00"
  - agent: claude-code
    action: started
    date: "2026-02-20T21:30:00-03:00"
---

## Objetivo do Sprint

Sprint leve e operacional focada em estabilizacao do ambiente de producao. Inclui correcao de bug critico na migration de seed, ativacao de monitoramento Sentry com source maps, validacao end-to-end da API de midias filtrantes em producao e revalidacao de seguranca HTTPS apos estabilizacao do dominio.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0280 | Corrigir migration seed filter_media_types: tipo UUID vs VARCHAR | 1 | critical | codex (review) |
| TASK-0268 | Ativar regra de alerta Sentry nos projetos backend e frontend | 3 | high | - |
| TASK-0279 | Executar teste em producao da API de midias filtrantes | 2 | high | - |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 | 2 | medium | - |
| TASK-0281 | Habilitar upload de source maps no CI/CD para Sentry | 3 | medium | - |

**Total de Pontos**: 11 / 21

## OKRs Vinculados

- Nenhum OKR vinculado

## Retrospectiva

**Encerrada em**: 2026-02-20 (mesmo dia de criacao — sprint rapida)

**Resultado**: 6/11 pontos entregues (3 de 5 tarefas concluidas).

**Concluidas**: TASK-0280 (fix migration UUID, 1pt), TASK-0268 (Sentry alertas, 3pts), TASK-0279 (teste producao filter media, 2pts).

**Nao concluidas**: TASK-0162 (SSL Labs, 2pts) e TASK-0281 (source maps, 3pts) — mantidos no backlog sem sprint. TASK-0162 depende de janela temporal (>= 25/02). TASK-0281 depende de TASK-0268 (concluida, mas sem tempo para execucao).

**Observacoes**: Sprint operacional eficiente. Bug critico corrigido e deployado, smoke tests completos em producao validaram filter media API com isolamento multi-tenant. Alertas Sentry ja estavam ativos.
