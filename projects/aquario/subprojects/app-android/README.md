---
id: app-android
parent: aquario
name: "AquaBook — App Android"
description: "Aplicativo Android nativo para aquaristas, profissionais e lojistas — React Native + Expo SDK 52, publicacao na Play Store"
repo: "/home/carlosfarah/Projects/aquario"
status: active
created_at: "2026-02-26T00:00:00-03:00"
created_by: claude-code
tech_stack:
  - react-native
  - expo
  - typescript
  - nativewind
  - zustand
  - tanstack-query
  - mmkv
  - react-navigation
  - victory-native
  - reanimated
  - firebase-fcm
okrs:
  - OKR-2026-Q2-11
---

## Visao Geral

App Android do AquaBook, construido em React Native + Expo SDK 52 como monorepo dentro do repositorio `/home/carlosfarah/Projects/aquario/mobile/`. Suporta 3 roles de usuario com navegacao dedicada:

- **USER** — aquarista comum: monitoramento de aquarios, alertas, social, marketplace
- **PRO** — aquarista profissional: consultoria, agenda, gestao de clientes
- **STORE** — lojista: e-commerce B2C, colaboradores, dashboard de pedidos

Modelo de monetizacao: **Reader App** (assinaturas gerenciadas pelo site, sem Google Play Billing). Conformidade total com politicas Play Store (account deletion, data safety, POST_NOTIFICATIONS).

## Escopo

### Incluido (MVP — role USER)

- Onboarding + Auth (email/senha + Google OAuth + Apple Sign In)
- Dashboard de aquario com leituras ao vivo (WebSocket) e sparklines
- Historico de parametros com graficos (AreaChart + period selector)
- Alertas ativos e historico
- Controle de reles (relay toggle com otimistic update)
- Manutencoes e equipamentos
- Feed social + perfil
- Marketplace (listagens, compra, pedidos)
- Push notifications FCM (alertas, mensagens, pedidos)
- PlanGate + TrialBanner (conformidade Play Store)
- Exclusao de conta (LGPD + Play Store obrigatorio)
- Offline-first (TanStack Query + MMKV, 7 dias de cache)

### Incluido (fase 2 — roles PRO e STORE)

- PRO: consultoria, agenda, clientes, anamnese
- STORE: catalogo, pedidos, colaboradores, dashboard

### Excluido do escopo

- iOS (App Store) — planejado para fase posterior
- Firmware ESP32 (escopo do projeto aquario principal)
- Web frontend (Next.js — escopo do projeto aquario principal)

## Arquitetura

```
/mobile
  app.config.ts         # Expo config (scheme, icon, splash, EAS)
  babel.config.js
  tsconfig.json
  src/
    app/                # Navegadores e telas
      navigators/       # RootNavigator, UserNavigator, ProNavigator, StoreNavigator
      screens/          # Telas agrupadas por role
        auth/           # Splash, Onboarding, Login, Register, ForgotPassword
        user/           # Home, AquariumDetail, History, Alerts, Social, Store, Profile
        pro/            # Dashboard, Clients, Consultations, Schedule
        store/          # Dashboard, Catalog, Orders, Collaborators
    shared/
      components/       # Button, Card, PlanGate, TrialBanner, OfflineBanner ...
      hooks/            # useNetworkStatus, useAppStateRefresh, useAquariumWS ...
      stores/           # authStore, aquariumStore, uiStore, cartStore ...
      api/              # queryClient, queryKeys, staleTimes, apiClient (axios)
      constants/        # colors, spacing, textStyles (design tokens)
```

## Documentacao de Referencia

- Design System: `mobile/ux/design-system/`
- Backend Readiness Map: `mobile/ux/BACKEND_READINESS.md`
- Auth Flow: `mobile/ux/AUTH_FLOW.md`
- Offline Strategy: `mobile/ux/OFFLINE_STRATEGY.md`
- Zustand Stores: `mobile/ux/STORES.md`
- Push Notifications: `mobile/ux/PUSH_NOTIFICATIONS.md`
- Monetizacao Play Store: `mobile/ux/MONETIZATION.md`
- Exclusao de Conta: `mobile/ux/ACCOUNT_DELETION.md`
- PRD: `docs/dev/PRD_APP_ANDROID.md`
- Master Dev Doc: `docs/dev/APP_MOBILE.md`

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/aquario/mobile
npm install
npx expo start
# build Android
eas build --platform android --profile preview
# submit Play Store
eas submit --platform android
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/aquario`
- Mobile source: `/home/carlosfarah/Projects/aquario/mobile/`
- Agente dev: `mobile/CLAUDE.md`
- Agente UX: `mobile/ux/CLAUDE.md`

## OKRs Vinculados

- OKR-2026-Q2-11: Lancar app AquaBook na Play Store com role USER completo

## Notas

- App fica em `/mobile/` dentro do monorepo — mesmo repo que backend e frontend
- Modelo Reader App: NUNCA exibir precos de assinatura dentro do app
- Backend tem gaps criticos a implementar antes do Sprint 2 (ver TASK-0659, TASK-0660, TASK-0661)
- Apple Sign In e obrigatorio para App Store (iOS) — nao e prioridade no MVP Android
- Agents: `claude-code` (implementer), `codex` (reviewer)
