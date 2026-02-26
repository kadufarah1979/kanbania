---
id: sprint-022
title: "Sprint 22 — Vinculo Broker Local -> Usuario"
goal: "Implementar fluxo seguro de ownership do broker local com claim por QR, aprovacao controlada, ACL MQTT robusta e validacao E2E"
start_date: "2026-03-18"
end_date: "2026-03-31"
status: completed
project: aquario
capacity: 21
created_by: codex
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: codex
    action: created
    date: "2026-02-18T01:52:42-03:00"
  - agent: codex
    action: activated
    date: "2026-02-18T04:21:53-03:00"
---

## Objetivo do Sprint

Garantir que o broker local (server ESP32) seja vinculado de forma segura e auditavel ao usuario comprador via fluxo de setup/claim, com controles de autorizacao no MQTT e evidencia de funcionamento ponta a ponta.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0176 | Especificar estados e contrato de associacao do broker local | 3 | high | — |
| TASK-0177 | Implementar device_setup_tokens (migration + model + service) | 5 | high | — |
| TASK-0178 | Implementar endpoints de setup/claim com token one-time | 3 | high | — |
| TASK-0179 | Harden ACL MQTT para onboarding restrito e namespace de clients | 3 | high | — |
| TASK-0180 | Firmware: handshake de registro e confirmacao de vinculo | 3 | high | — |
| TASK-0181 | Admin flow: aprovacao/rejeicao com trilha de auditoria | 2 | medium | — |
| TASK-0182 | Validar E2E QR -> claim -> approve -> MQTT + runbook operacional | 2 | medium | — |

**Total de Pontos**: 21

## Dependencias

```
TASK-0176
  |
  +-> TASK-0177
  +-> TASK-0178
  +-> TASK-0179

TASK-0177 + TASK-0178
  |
  +-> TASK-0181

TASK-0179 + TASK-0180 + TASK-0181
  |
  +-> TASK-0182
```

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook com monitoramento e provisioning robusto

## Criterios de Aceite da Sprint

- [x] Claim de broker exige token valido, nao reutilizavel e ownership do aquario
- [x] Server nao associado acessa somente `aquario/<serial>/register`
- [x] Server associado acessa namespace proprio e dos clients permitidos
- [x] Fluxo E2E validado com testes e evidencias operacionais
- [x] Runbook de suporte publicado para troubleshooting de onboarding

## Retrospectiva

### O que foi bem
- Sprint 100% concluida: todas as 7 tasks planejadas foram entregues (21/21 pts)
- Fluxo completo de ownership do broker local implementado de ponta a ponta
- TASK-0176 (especificacao/contrato) serviu como alicerce solido para as demais tasks
- ACL MQTT hardened com namespace restrito (TASK-0179)
- Validacao E2E com runbook operacional publicado (TASK-0182)

### O que pode melhorar
- Nenhuma observacao critica -- sprint fluiu bem com dependencias claras

### Metricas
- **Pontos planejados**: 21
- **Pontos entregues**: 21
- **Velocidade**: 21 pts/sprint
- **Taxa de conclusao**: 100%
