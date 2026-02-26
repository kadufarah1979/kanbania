---
id: sprint-064
title: "Sprint 64 - Backend rollout wave 1"
goal: "Executar a primeira onda de padronizacao e validacao de deploy das APIs do backend com maior chance de aprovacao direta"
project: mdm-terraform
start_date: "2026-02-23"
end_date: "2026-03-08"
status: active
capacity: 21
created_by: "codex"
okrs: []
acted_by:
  - agent: "codex"
    action: created
    date: "2026-02-23T20:55:00-03:00"
---

## Objetivo do Sprint

Executar a primeira onda de rollout das APIs backend priorizando projetos com maior probabilidade de passar em pipeline e deploy sem retrabalho, garantindo padronizacao do CI e evidencias de implantacao.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0467 | [Backend] Padronizar e validar implantacao direta da api-acl | 2 | high | - |
| TASK-0468 | [Backend] Padronizar e validar implantacao direta da api-equipment | 2 | high | - |
| TASK-0469 | [Backend] Padronizar e validar implantacao direta da api-gatewaykong | 2 | high | - |
| TASK-0470 | [Backend] Padronizar e validar implantacao direta da api-mdm | 2 | high | - |
| TASK-0471 | [Backend] Padronizar e validar implantacao direta da api-media | 2 | high | - |
| TASK-0477 | [Backend] Validar implantacao direta da api-iot | 2 | medium | - |
| TASK-0478 | [Backend] Validar implantacao direta da api-iso | 2 | medium | - |
| TASK-0473 | [Backend] Corrigir pipeline da api-appsign (lint) | 2 | medium | - |
| TASK-0476 | [Backend] Corrigir pipeline da api-mailer (tests) | 2 | medium | - |
| TASK-0472 | [Backend] Estruturar CI/CD base para api-application | 2 | medium | - |

**Total de Pontos**: 20 / 21

## Criterios de Aceite da Sprint

- [ ] Pelo menos 5 APIs da onda 1 com pipeline verde no branch alvo
- [ ] Deploy validado nas APIs priorizadas sem regressao funcional
- [ ] Evidencias de pipeline/deploy registradas nas respectivas tasks
- [ ] Padrao de ajustes replicavel para as proximas ondas

## Retrospectiva

(a preencher ao final da sprint)
