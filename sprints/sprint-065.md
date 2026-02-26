---
id: sprint-065
title: "Sprint 65 - Backend rollout wave 2"
goal: "Executar a segunda onda de ajustes de pipeline/deploy das APIs backend com menor previsibilidade de aprovacao direta"
project: mdm-terraform
start_date: "2026-03-09"
end_date: "2026-03-22"
status: pending
capacity: 21
created_by: "codex"
okrs: []
acted_by:
  - agent: "codex"
    action: created
    date: "2026-02-23T21:08:00-03:00"
---

## Objetivo do Sprint

Concluir a segunda onda de rollout backend atacando pipelines com maior risco tecnico ou dependencia de ajustes estruturais, consolidando o padrao aplicado na wave 1.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0474 | [Backend] Corrigir pipeline da api-certificate (resolucao de modulos) | 2 | medium | - |
| TASK-0475 | [Backend] Corrigir pipeline da api-dashboard (resolucao de modulos) | 2 | medium | - |
| TASK-0479 | [Backend] Desbloquear pipeline pendente da api-eqplistener | 2 | low | - |
| TASK-0480 | [Backend] Corrigir deploy da api-report (IAM/SSM) | 2 | low | - |
| TASK-0481 | [Backend] Validar estrategia de deploy da api-gatewaykong-bkp | 2 | low | - |

**Total de Pontos**: 10 / 21

## Criterios de Aceite da Sprint

- [ ] Pipelines das APIs da wave 2 estabilizados no branch alvo
- [ ] Ajustes de build/test/deploy documentados nas tasks
- [ ] Evidencias de execucao (URLs de pipeline/jobs) registradas
- [ ] Fluxo de rollout pronto para fechamento do backlog backend

## Retrospectiva

(a preencher ao final da sprint)
