---
id: sprint-006
title: "Sprint 6 — Marketplace Completo + Play Store Prep"
project: aquario
subproject: app-android
goal: "Carrinho, Checkout, Pedidos, Automacao, Data Safety Form, EAS production build e Notification Center"
start_date: "2026-04-28"
end_date: "2026-05-11"
status: pending
capacity: 18
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-11
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-28T14:00:00-03:00"
---

## Objetivo do Sprint

Fechar o loop do Marketplace (carrinho, checkout, meus pedidos). Implementar Automacao
de relay rules. Cumprir requisitos obrigatorios da Play Store (Data Safety + Privacy Policy).
Gerar o EAS Build production e preparar o Store Listing. Milestone: USER role 100% completo.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0691 | CartScreen (cartStore + add/remove/total + UI) | 3 | high |
| TASK-0692 | CheckoutScreen (endereco + POST /marketplace/orders) | 2 | high |
| TASK-0693 | Meus Pedidos (historico de compras + status entrega) | 2 | high |
| TASK-0694 | Automacao (criar/editar/testar regras de relay) | 3 | medium |
| TASK-0695 | Data Safety Form + Privacy Policy screen + Account Deletion link | 2 | critical |
| TASK-0696 | EAS Build production profile + Play Store listing draft | 3 | critical |
| TASK-0697 | Notification Center (in-app list, unread count badge) | 3 | medium |

**Total de Pontos**: 18 / 18

## OKRs Vinculados

- OKR-2026-Q2-11: KR-01 (100% USER), KR-02 (Play Store), KR-03 (PlanGate)

## Notas de Execucao

- TASK-0691 bloqueia TASK-0692; TASK-0692 bloqueia TASK-0693
- TASK-0694 depende de TASK-0671 (sprint-003)
- TASK-0695 depende de TASK-0666 (sprint-002)
- TASK-0696 e TASK-0695 bloqueiam TASK-0719 (sprint-009)
- TASK-0697 depende de TASK-0663 (sprint-002)
- **MILESTONE**: ao final deste sprint, USER role esta 100% completo — candidato a beta Play Store

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 18
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
