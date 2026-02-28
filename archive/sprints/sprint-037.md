---
id: sprint-037
title: "Sprint 37 - TPA Enriquecido e Pendencias Operacionais"
project: aquario
goal: "Implementar modulo de TPA completo (backend + frontend) com marcas de sal, graficos de impacto e historico, resolver pendencias operacionais (source maps Sentry + SSL) e melhorar UX de empty states"
start_date: "2026-02-20"
end_date: "2026-03-06"
status: completed
capacity: 21
created_by: claude-code
okrs: []
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-20T23:30:00-03:00"
  - agent: claude-code
    action: started
    date: "2026-02-20T23:30:00-03:00"
  - agent: claude-code
    action: completed
    date: "2026-02-21T01:30:00-03:00"
---

## Objetivo do Sprint

Sprint focada em enriquecer o modulo de TPA (Troca Parcial de Agua) que ja tem backend basico funcional, adicionando marcas de sal pre-cadastradas, fonte de agua, parametros antes/depois, calculo de percentual, historico com graficos de impacto e agendamento. Inclui tambem resolucao de duas pendencias operacionais do backlog (source maps para Sentry e revalidacao SSL Labs/SecurityHeaders) e melhorias de UX em componentes de empty state.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0282 | Enriquecer backend TPA: marcas de sal, fonte de agua, params antes/depois | 5 | high | - |
| TASK-0283 | Enriquecer frontend TPA: formulario completo, historico e graficos | 8 | high | - |
| TASK-0281 | Habilitar upload de source maps no CI/CD para Sentry | 3 | medium | - |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 | 2 | medium | - |
| TASK-0284 | Adicionar variante compacta ao EmptyState e emptyDescription ao AlertList | 2 | low | - |

**Total de Pontos**: 20 / 21

## OKRs Vinculados

- Nenhum OKR vinculado

## Retrospectiva

**Encerrada em**: 2026-02-21 (1 dia de execucao, encerrada antecipadamente)
**Pontos entregues**: 18/20 (90%)
**Pontos nao entregues**: 2 (TASK-0162 devolvida ao backlog - bloqueada por janela temporal)

### O que deu certo
- Modulo TPA completo entregue em ~24h (backend + frontend, 13pts)
- Source maps para Sentry configurados e deploy passou com sucesso
- QA do codex funcionou bem como gate de qualidade, identificando pendencias reais (grafico Recharts, params antes/depois, percentual automatico)
- EmptyState UX ja estava implementado retroativamente (2pts sem esforco)

### O que pode melhorar
- TASK-0162 (SSL Labs) nao deveria ter entrado na sprint - bloqueada por data futura, sem possibilidade de execucao
- Problema no GitLab self-hosted impediu criacao de PAT, causando atraso na configuracao das variaveis Sentry
- Cards movidos para review foram revertidos pelo codex em conflitos de merge no kanbania - sincronizacao entre agentes precisa de melhoria

### Acoes
- Nao incluir tasks com bloqueio temporal em sprints com janela menor que o bloqueio
- Investigar bug de criacao de PAT no GitLab self-hosted
