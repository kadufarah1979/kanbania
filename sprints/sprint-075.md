---
id: sprint-075
title: "Sprint 75 - Conformidade pt-BR, UX e monitoramento de producao"
project: aquario
goal: "Finalizar conformidade pt-BR no frontend, ativar monitoramento de producao (Sentry + SSL) e ajustes de UX pendentes"
start_date: "2026-02-24"
end_date: "2026-03-09"
status: active
capacity: 21
created_by: "claude-code"
okrs: []
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-24T12:00:00-03:00"
  - agent: "claude-code"
    action: started
    date: "2026-02-24T12:00:00-03:00"
---

## Objetivo do Sprint

Finalizar a conformidade pt-BR no frontend do aquaBook (auditoria de idioma, formatacao
de datas/moedas, traducao da pagina /parameters e checklist final). Ativar monitoramento
de producao com regras de alerta no Sentry, upload de source maps via CI/CD e revalidacao
dos certificados SSL. Incluir ajustes de UX pendentes: variante compacta do EmptyState
e prop de descricao configuravel no AlertList.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 | 2 | medium | - |
| TASK-0288 | Ativar regra de alerta Sentry nos projetos backend e frontend | 2 | high | - |
| TASK-0541 | EmptyState — adicionar variante compacta size=sm | 2 | medium | - |
| TASK-0542 | AlertList — adicionar prop emptyDescription configuravel | 1 | low | - |
| TASK-0543 | Auditoria e correcao de idioma pt-BR em todo o frontend | 3 | high | - |
| TASK-0544 | Padronizar formatos de data, hora, moeda e numeros em pt-BR | 3 | high | - |
| TASK-0545 | Traduzir pagina /parameters para pt-BR | 2 | high | - |
| TASK-0546 | Checklist final de conformidade pt-BR por modulo | 2 | medium | - |
| TASK-0547 | Habilitar upload de source maps Sentry no CI/CD | 2 | medium | - |

**Total de Pontos**: 19 / 21

## OKRs Vinculados

- Nenhum OKR vinculado diretamente

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
-

### O que pode melhorar
-

### Metricas
- **Pontos planejados**: 19
- **Pontos entregues**: -
- **Velocidade**: - pts/sprint
- **Taxa de conclusao**: -%
