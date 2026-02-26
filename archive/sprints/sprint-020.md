---
id: sprint-020
title: "Sprint 20 — Livestock, Equipment & Ops Polish"
goal: "Consolidar modulos Livestock e Equipment ja implementados, commitar e deployar, e finalizar pendencias operacionais pos-go-live (Sentry alerts, source maps, SSL revalidacao)"
start_date: "2026-02-17"
end_date: "2026-03-03"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-17T22:00:00-03:00"
  - agent: codex
    action: completed
    date: "2026-02-18T04:16:39-03:00"
---

## Objetivo do Sprint

Consolidar os modulos Livestock e Equipment que ja estao implementados localmente (uncommitted), garantir que testes passam, commitar e deployar em producao. Paralelamente, finalizar as 3 pendencias operacionais de pos-go-live que dependiam de maturacao (Sentry alerts, source maps CI/CD, SSL revalidacao).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0163 | Commit e push de todas as mudancas pendentes (Sentry, livestock, equipment, infra) | 2 | critical | — |
| TASK-0164 | Validar e corrigir testes do modulo Livestock (frontend + backend) | 3 | high | — |
| TASK-0165 | Validar e corrigir testes do modulo Equipment (frontend) | 3 | high | — |
| TASK-0166 | Deploy em producao com livestock + equipment + Sentry | 2 | high | — |
| TASK-0160 | Ativar alerta Sentry >10 eventos/min (apos 25-02) | 2 | high | — |
| TASK-0161 | Habilitar source maps do Sentry no CI/CD (apos 25-02) | 3 | medium | — |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders (apos 25-02) | 2 | medium | — |
| TASK-0167 | Documentar modulos Livestock e Equipment no CODEX.md | 2 | low | — |

**Total de Pontos**: 19

## Dependencias

```
TASK-0163 (commit/push)
    |
    +-> TASK-0164 (testes livestock)
    +-> TASK-0165 (testes equipment)
    |       |
    +-------+-> TASK-0166 (deploy producao)
                    |
                    +-> TASK-0160 (Sentry alerts — apos 25-02)
                    +-> TASK-0161 (source maps — apos 25-02)
                    +-> TASK-0162 (SSL revalidacao — apos 25-02)

TASK-0167 (docs) — independente
```

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook — estende funcionalidades alem do core de monitoramento

## Criterios de Aceite da Sprint

- [ ] Todas as mudancas locais commitadas e pushadas
- [ ] Testes backend passando (livestock service, schemas, seed data)
- [ ] Testes frontend passando (livestock page, equipment page, components)
- [ ] Deploy em producao com novos modulos funcionais
- [ ] Alerta Sentry >10/min ativo e verificado (apos 25-02)
- [ ] Source maps uploadando no CI/CD
- [ ] SSL Labs e SecurityHeaders com nota A ou A+
- [ ] CODEX.md atualizado com novos modulos

## Retrospectiva

### Encerramento
- Sprint encerrada em 2026-02-18 com entregas principais concluídas (`TASK-0163` a `TASK-0167`).
- Pendências operacionais pós-25/02 foram tratadas como spillover:
  - `TASK-0160` e `TASK-0161` concluídas (arquivadas em done).
  - `TASK-0162` carregada para `sprint-021` (janela de execução >= 2026-02-25).
