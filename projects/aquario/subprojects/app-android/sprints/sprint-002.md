---
id: sprint-002
title: "Sprint 2 — Auth Completo + FCM + Aquario CRUD"
project: aquario
subproject: app-android
goal: "Google Sign-In funcional, Push FCM registrado, Excluir Conta (LGPD), Cadastrar Aquario e Vincular Dispositivo via QR Code"
start_date: "2026-03-03"
end_date: "2026-03-16"
status: active
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

Completar a camada de autenticacao (Google Sign-In PKCE), registrar Push FCM no backend,
implementar o requisito obrigatorio da Play Store (Excluir Conta / LGPD) e entregar as
primeiras features de produto: Cadastrar Aquario e Vincular Dispositivo via QR Code.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0664 | Google Sign-In — frontend PKCE (expo-auth-session, LoginScreen) | 3 | high |
| TASK-0665 | Google Sign-In — integrar resposta backend + store tokens | 2 | high |
| TASK-0663 | Push Notifications FCM — registro token + handlers fore/background | 3 | high |
| TASK-0666 | Excluir Conta (LGPD + Play Store obrigatorio) | 2 | critical |
| TASK-0667 | Cadastrar Aquario — form + POST /aquariums | 3 | high |
| TASK-0668 | Vincular Dispositivo via QR Code (expo-barcode-scanner) | 3 | high |
| TASK-0669 | Configuracoes de Notificacao no Perfil (notificationStore) | 2 | medium |

**Total de Pontos**: 18 / 18

## OKRs Vinculados

- OKR-2026-Q2-11: KR-01 (features USER), KR-04 (FCM)

## Notas de Execucao

- TASK-0664 bloqueia TASK-0665
- TASK-0663 bloqueia TASK-0669
- TASK-0667 bloqueia TASK-0668
- TASK-0666 e TASK-0695 (sprint-006): dependencia sequencial para Data Safety Form

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
