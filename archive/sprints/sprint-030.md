---
id: sprint-030
title: "Automacao Fase 2 — Integracao Frontend + Schedule + Latencia"
goal: "Atualizar frontend para novo schema de automacao, adicionar regras baseadas em horario, medir latencia end-to-end e avancar KRs do OKR-2026-Q1-02"
start_date: "2026-02-19"
end_date: "2026-03-05"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-02]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-19T16:30:00-03:00"
  - agent: claude-code
    action: started
    date: "2026-02-19T16:30:00-03:00"
---

## Objetivo do Sprint

Consolidar o sistema de automacao entregue na sprint-028 atualizando o frontend para o novo schema (RelayChannel, sensor_type, cooldown_seconds), integrando os novos endpoints de relays, adicionando regras baseadas em horario (schedule), e instrumentando a medicao de latencia end-to-end. Ao final, os 3 KRs do OKR-2026-Q1-02 devem estar parcialmente ou totalmente atingidos.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0238 | Frontend: atualizar automation page e store para novo schema do backend | 5 | critical | unassigned |
| TASK-0239 | Frontend: integrar endpoints /api/v1/relays/ no painel de controle manual | 3 | high | unassigned |
| TASK-0240 | Backend: regras de automacao baseadas em horario (schedule rules) | 5 | high | unassigned |
| TASK-0241 | Backend+Firmware: instrumentar medicao de latencia comando-a-atuacao | 3 | high | unassigned |
| TASK-0242 | Frontend: dashboard de status dos relay channels com historico de acoes | 3 | medium | unassigned |
| TASK-0243 | Backend: provisionar relay channels automaticamente no registro de device | 2 | medium | unassigned |

**Total de Pontos**: 21 / 21

## OKRs Vinculados

- OKR-2026-Q1-02: Implementar automacao e controle de equipamentos do aquario via relay controller ESP32
  - KR-01 (4 devices): relay channels provisionados e controlados via frontend
  - KR-02 (5 regras): regras sensor-based + schedule-based configuradas
  - KR-03 (latencia < 2s): instrumentacao de medicao end-to-end

## Retrospectiva

{Preenchido ao final do sprint}
