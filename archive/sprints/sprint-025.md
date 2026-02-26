---
id: sprint-025
title: "Sprint 25 — Notificacoes In-App + Google Sign-In + Leituras Manuais"
goal: "Melhorar onboarding (Google Sign-In), visibilidade de notificacoes in-app (bell dropdown), e entrada manual de leituras via test kits"
start_date: "2026-03-04"
end_date: "2026-03-18"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-18T18:00:00-03:00"
---

## Objetivo do Sprint

Entregar 3 pilares pos-MVP: (1) notificacoes in-app com bell dropdown e contagem de nao-lidas atualizando via WebSocket, (2) Google Sign-In para reduzir friccao de cadastro, (3) formulario de leitura manual para parametros medidos com test kits (pH, ammonia, nitrato, etc).

Objetivo tangivel: usuario ve sino com contagem no header, faz login com Google em 1 clique, e registra leituras manuais com validacao e alertas.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0191 | Backend: notificacoes in-app (model + CRUD + WS) | 5 | high | unassigned |
| TASK-0192 | Frontend: notification bell + dropdown in-app | 3 | high | unassigned |
| TASK-0193 | Backend: Google Sign-In (OAuth2 / id_token) | 5 | high | unassigned |
| TASK-0194 | Frontend: botao "Entrar com Google" + fluxo OAuth | 3 | high | unassigned |
| TASK-0195 | Backend: endpoint leitura manual com validacao | 3 | medium | unassigned |
| TASK-0196 | Frontend: formulario de leitura manual (test kits) | 3 | medium | unassigned |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 (spillover) | 2 | medium | codex |

**Total de Pontos**: 24 / 21

## OKRs Vinculados

- OKR-2026-Q1-01: MVP AquaBook — contribui para KR-03 (notificacoes) e extensao pos-MVP

## Dependencias Entre Tarefas

- TASK-0192 depends_on TASK-0191 (frontend precisa do backend de notificacoes in-app)
- TASK-0194 depends_on TASK-0193 (frontend precisa do endpoint de auth google)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 22
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
