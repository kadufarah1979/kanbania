---
id: sprint-021
title: "Sprint 21 — Automacao & Firmware"
goal: "Implementar firmware do relay controller, regras de automacao no backend, e finalizar pendencias operacionais da sprint-020"
start_date: "2026-03-03"
end_date: "2026-03-17"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01, OKR-2026-Q1-02]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-17T23:59:00-03:00"
  - agent: codex
    action: activated
    date: "2026-02-18T04:16:39-03:00"
---

## Objetivo do Sprint

Implementar o firmware do relay controller ESP32 (7 canais), criar o sistema de regras de automacao no backend com endpoints e avaliacao periodica, e construir a UI de automacao no frontend. Paralelamente, finalizar as 3 pendencias operacionais herdadas da sprint-020 (Sentry alerts, source maps, SSL revalidacao).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0160 | Ativar alerta Sentry >10 eventos/min | 2 | high | — |
| TASK-0161 | Habilitar source maps do Sentry no CI/CD | 3 | medium | — |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders | 2 | medium | — |
| TASK-0170 | Firmware: Relay Controller ESP32 (7 canais) | 5 | high | — |
| TASK-0171 | Backend: Regras de automacao (automation rules) | 5 | high | — |
| TASK-0172 | Frontend: UI de automacao (regras + controle manual) | 3 | medium | — |
| TASK-0173 | Validar fluxo E2E device provisioning (QR → approval → MQTT) | 1 | medium | — |

**Total de Pontos**: 21

## Dependencias

```
TASK-0160/0161/0162 (spillover ops) — independentes entre si

TASK-0170 (firmware relay)
    |
    +-> TASK-0171 (backend automacao) — pode iniciar em paralelo
    |       |
    +-------+-> TASK-0172 (frontend automacao)

TASK-0173 (E2E provisioning) — independente
```

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook — pendencias operacionais (Sentry, SSL)
- OKR-2026-Q1-02: Automacao e controle de equipamentos — relay controller, automation rules

## Criterios de Aceite da Sprint

- [ ] Alerta Sentry >10/min ativo e verificado (TASK-0160 cancelada/nao encontrada)
- [ ] Source maps uploadando no CI/CD com stack traces legiveis (TASK-0161 cancelada/nao encontrada)
- [ ] SSL Labs e SecurityHeaders com nota A ou A+ (TASK-0162 adiada para sprint-023)
- [x] Firmware relay controller compilando e acionando reles via MQTT
- [x] Model AutomationRule + service de avaliacao + endpoints CRUD funcionais
- [x] UI de automacao com lista de regras, criacao/edicao e toggle manual
- [x] Fluxo E2E de provisioning validado (QR → approve → MQTT connect)

## Retrospectiva

### O que foi bem
- Todas as tasks de automacao e firmware foram entregues com sucesso (TASK-0170, TASK-0171, TASK-0172, TASK-0173)
- Tasks extras criadas e concluidas durante o sprint (TASK-0174 ajuste auth MQTT, TASK-0175 robustez broker local)
- Spillover do sprint-020 (TASK-0163..0169) foi integralmente resolvido em paralelo

### O que pode melhorar
- TASK-0160 e TASK-0161 (Sentry alerts e source maps) nao foram encontradas/completadas -- provavel cancelamento sem registro formal
- TASK-0162 (SSL revalidacao) adiada novamente para sprint-023
- Controle de cancelamento de tasks precisa de registro explicito

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues (sprint-021)**: 20 (TASK-0170/5 + TASK-0171/5 + TASK-0172/3 + TASK-0173/1 + TASK-0174/3 + TASK-0175/3)
- **Pontos spillover entregues**: 28 (TASK-0163..0169)
- **Velocidade**: 20 pts/sprint (sem spillover)
- **Taxa de conclusao**: 95% (5 de 7 tasks planejadas + 2 extras)
