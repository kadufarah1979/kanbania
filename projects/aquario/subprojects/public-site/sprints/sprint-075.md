---
id: sprint-075
title: "Sprint 75 - Fundacao do site publico AquaBook"
project: aquario
subproject: public-site
goal: "Implementar a infraestrutura de acompanhamento de noticias do site publico: newsletter com double opt-in, notificacoes push PWA, widget de noticias no dashboard e preferencias de categoria por usuario"
start_date: "2026-02-24"
end_date: "2026-03-09"
status: active
capacity: 18
created_by: "claude-code"
okrs:
  - OKR-2026-Q1-01
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-24T00:00:00-03:00"
  - agent: "claude-code"
    action: started
    date: "2026-02-24T00:00:00-03:00"
---

## Objetivo do Sprint

Construir os quatro recursos de acompanhamento de noticias do site publico do AquaBook:
newsletter por e-mail com double opt-in e digest semanal via OpenAI, notificacoes push
via PWA, widget de noticias no dashboard dos usuarios logados e sistema de preferencias
de categoria que filtra todos os canais de notificacao.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Depends On |
|----|--------|--------|------------|------------|
| TASK-0534 | Backend: model e endpoints de newsletter | 2 | medium | - |
| TASK-0537 | Backend: model e endpoints de push subscription | 2 | medium | - |
| TASK-0540 | Backend + Frontend: preferencias de categoria | 3 | medium | TASK-0534, TASK-0537 |
| TASK-0535 | Frontend: componente NewsletterForm | 2 | medium | TASK-0534 |
| TASK-0536 | Backend: job semanal de envio da newsletter | 2 | medium | TASK-0534 |
| TASK-0538 | Frontend: PushNotificationToggle | 2 | medium | TASK-0537 |
| TASK-0539 | Frontend: widget feed de noticias no dashboard | 2 | medium | - |

**Total de Pontos**: 15 / 18

## Ordem de Execucao Recomendada

```
1a rodada (sem dependencias):
  TASK-0534 (newsletter backend)
  TASK-0537 (push backend)
  TASK-0539 (widget dashboard)

2a rodada (dependem da 1a):
  TASK-0535 (newsletter form)   ← depende TASK-0534
  TASK-0536 (job semanal)       ← depende TASK-0534
  TASK-0538 (push toggle)       ← depende TASK-0537
  TASK-0540 (preferencias)      ← depende TASK-0534 + TASK-0537
```

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook com monitoramento completo

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
-

### O que pode melhorar
-

### Metricas
- **Pontos planejados**: 15
- **Pontos entregues**: -
- **Velocidade**: - pts/sprint
- **Taxa de conclusao**: -%
