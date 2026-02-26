---
id: sprint-001
title: "Sprint 1 — Fundacao do App Android"
project: aquario
subproject: app-android
goal: "Monorepo Expo configurado, Design System base implementado, AuthStack funcional e navegacao por role com TanStack Query + MMKV"
start_date: "2026-03-03"
end_date: "2026-03-16"
status: planned
capacity: 18
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-11
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-26T00:00:00-03:00"
---

## Objetivo do Sprint

Estabelecer toda a fundacao tecnica do app antes de qualquer feature de produto:
estrutura de pastas, toolchain (Expo + EAS + NativeWind), Design System base,
fluxo de autenticacao completo e navegacao por role. Ao final deste sprint,
um engenheiro deve conseguir rodar o app, fazer login e ver o UserNavigator vazio.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0647 | Monorepo Expo SDK 52 + EAS setup | 3 | critical |
| TASK-0648 | Design System base — tokens + NativeWind + componentes base | 3 | high |
| TASK-0649 | AuthStack — Onboarding, Login, Cadastro, ForgotPassword | 3 | high |
| TASK-0650 | authStore Zustand + MMKV persist + interceptor auto-refresh | 2 | high |
| TASK-0651 | queryClient TanStack Query v5 + persister MMKV + queryKeys | 2 | high |
| TASK-0652 | UserNavigator — RootNavigator + BottomTabs + OfflineBanner | 3 | high |

**Total de Pontos**: 16 / 18 (2 SP buffer para ajustes de toolchain)

## OKRs Vinculados

- OKR-2026-Q2-11: Lancar app AquaBook Android — fundacao habilita todos os KRs

## Notas de Execucao

- TASK-0647 bloqueia todas as outras — iniciar primeiro
- TASK-0648 bloqueia TASK-0649 e TASK-0652 (depende dos tokens)
- TASK-0650 e TASK-0651 sao independentes entre si mas dependem de TASK-0647
- TASK-0649 depende de TASK-0650 (authStore) e TASK-0648 (componentes)
- TASK-0652 depende de TASK-0649 (para o RootNavigator) e TASK-0651 (QueryClientProvider)
- Criterio de saida: `npx expo start` sem erros + login funcional + UserNavigator exibido

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 16
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
