---
id: sprint-074
title: "Sprint 74 - Hardware validation, accuracy QA e seguranca"
project: aquario
goal: "Concluir validacao de hardware fisico (24h, E2E, OTA), finalizar QA de accuracy do color matching e ativar monitoramento de seguranca (Sentry + SSL)"
start_date: "2026-02-24"
end_date: "2026-03-09"
status: active
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q1-01
  - OKR-2026-Q2-05
  - OKR-2026-Q2-06
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-24T02:50:00-03:00"
  - agent: "claude-code"
    action: started
    date: "2026-02-24T02:50:00-03:00"
---

## Objetivo do Sprint

Finalizar os criterios de hardware fisico pendentes (teste de estabilidade 24h,
E2E completo com sensores reais, validacao OTA no ESP32 e documentacao visual).
Concluir o ciclo QA do sistema de accuracy do color matching criando o wrapper
de script e re-submetendo para aprovacao. Ativar regras de alerta no Sentry e
revalidar certificados SSL/SecurityHeaders apos janela de 25/02.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0288 | Ativar alertas Sentry nos projetos backend e frontend | 2 | high | - |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 | 2 | medium | - |
| TASK-0374 | Seed - dados de calibracao para 10+ kits populares | 3 | medium | - |
| TASK-0422 | Firmware - validacao OTA em hardware real (ESP32) | 3 | medium | - |
| TASK-0526 | Criar wrapper scripts/validate_accuracy.py na raiz | 2 | medium | - |
| TASK-0527 | Re-submeter TASK-0375 para QA apos correcao de path | 1 | medium | - |
| TASK-0528 | Teste de estabilidade 24h do firmware + coleta metricas heap | 2 | medium | - |
| TASK-0529 | E2E hardware: provisioning WiFi, sensores, dashboard e alertas | 2 | medium | - |
| TASK-0530 | Fotos da montagem hardware + documentar em docs/hardware/ | 1 | medium | - |

**Total de Pontos**: 18 / 21

## OKRs Vinculados

- OKR-2026-Q1-01: Seguranca e observabilidade em producao
- OKR-2026-Q2-05: Accuracy do color matching >= 85%
- OKR-2026-Q2-06: Validacao hardware fisico completa

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
-

### O que pode melhorar
-

### Metricas
- **Pontos planejados**: 18
- **Pontos entregues**: -
- **Velocidade**: - pts/sprint
- **Taxa de conclusao**: -%
