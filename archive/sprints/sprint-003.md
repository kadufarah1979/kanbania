---
id: sprint-003
title: "AquaBook Fase 2 — Ingestão de Dados: MQTT Consumer + API Manual"
goal: "Dados do ESP32 fluindo via MQTT para o TimescaleDB, endpoint de leituras manuais funcional, detecção de device offline"
start_date: "2026-03-14"
end_date: "2026-03-27"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-14T10:00:00-03:00"
---

## Objetivo do Sprint

Implementar o pipeline completo de ingestão de dados. O MQTT consumer async (aiomqtt) escuta os tópicos do ESP32, parseia os payloads, valida e grava no TimescaleDB. Device heartbeat detecta quando sensores ficam offline. Endpoint REST permite registrar leituras manuais de test kits. Endpoints de consulta retornam dados com filtros e agregações.

**Ao final deste sprint:** Dados do ESP32 fluindo para o banco em tempo real + API de leituras funcional.

## Tarefas Planejadas

| ID | Título | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0017 | Implementar MQTT consumer async (aiomqtt) | 5 | critical | claude-code |
| TASK-0018 | Implementar pipeline de ingestão (parse, validate, store) | 5 | high | claude-code |
| TASK-0019 | Implementar device heartbeat e detecção offline | 3 | high | claude-code |
| TASK-0020 | Implementar endpoint de leituras manuais | 3 | high | claude-code |
| TASK-0021 | Implementar endpoints de consulta (latest + histórico) | 3 | high | claude-code |
| TASK-0022 | Implementar avaliação básica de alertas ao ingerir leitura | 2 | medium | claude-code |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q1-01: Contribui para KR-01 (ingestão de 2 tipos de sensor) e KR-04 (fase 2 de 5)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Métricas
- **Pontos planejados**: 21
- **Pontos entregues**: 0
- **Velocidade**: 0 pts/sprint
- **Taxa de conclusão**: 0%
