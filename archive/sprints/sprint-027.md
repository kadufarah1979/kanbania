---
id: sprint-027
title: "Sprint 27 — Manutencao, Galeria, UX pt-BR e Observabilidade"
goal: "Adicionar rastreamento de rotinas de manutencao (TPA, midias), galeria de fotos com snapshot de parametros, auditoria completa pt-BR, e melhorias de observabilidade (Sentry)"
start_date: "2026-04-01"
end_date: "2026-04-15"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-18T23:50:00-03:00"
---

## Objetivo do Sprint

Entregar 4 pilares: (1) backend+frontend de manutencao e rotinas (TPA, midias filtrantes), (2) galeria de fotos com snapshot de parametros, (3) auditoria e padronizacao completa pt-BR, (4) Sentry alertas + source maps.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0220 | Backend: manutencao e rotinas (TPA, alimentacao, midias) | 5 | high | unassigned |
| TASK-0221 | Frontend: pagina de manutencao e rotinas | 5 | high | unassigned |
| TASK-0222 | Backend: galeria de fotos com snapshot de parametros | 5 | medium | unassigned |
| TASK-0223 | Frontend: galeria de fotos do aquario | 3 | medium | unassigned |
| TASK-0224 | Frontend: auditoria e correcao pt-BR | 3 | high | unassigned |
| TASK-0225 | Frontend: EmptyState compacto + AlertList emptyDescription | 2 | medium | unassigned |
| TASK-0226 | Infra: Sentry alertas + source maps no CI/CD | 2 | high | unassigned |

**Total de Pontos**: 25 / 21 (sobrecarga intencional — TASK-0225 pode ser spillover)

## Backlog (nao agendado)

| ID | Titulo | Pontos |
|----|--------|--------|
| TASK-0227 | Backend: chat 1:1 via WebSocket | 8 |
| TASK-0228 | Frontend: inbox de chat e thread | 5 |

## Dependencias Entre Tarefas

- TASK-0221 depends_on TASK-0220 (frontend precisa do backend de manutencao)
- TASK-0223 depends_on TASK-0222 (frontend precisa do backend de galeria)

## OKRs Vinculados

- OKR-2026-Q1-01: MVP AquaBook — contribui para KR pos-MVP (manutencao, galeria, UX)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 25
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
