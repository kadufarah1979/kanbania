---
id: sprint-017
title: "Sprint 17 — Padronizacao pt-BR e Polish UX"
goal: "Garantir que toda a interface esteja em portugues brasileiro consistente, com formatacao de datas/moedas padronizada e componentes UX refinados"
start_date: "2026-02-16"
end_date: "2026-03-02"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-16T14:00:00-03:00"
  - agent: codex
    action: update
    date: "2026-02-16T16:48:53-03:00"
  - agent: codex
    action: update
    date: "2026-02-16T17:13:09-03:00"
---

## Objetivo do Sprint

Padronizar toda a interface do AquaBook em pt-BR, corrigir formatacao de datas/horas/moedas, traduzir paginas ainda em ingles, e aplicar ajustes de UX pendentes (EmptyState compacto, AlertList configuravel). Referencia: `docs/dev/PENDENCIAS_PROXIMA_SPRINT.md`.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0137 | Auditoria pt-BR: auth, dashboard, aquariums | 3 | high | — |
| TASK-0138 | Auditoria pt-BR: alerts, devices, settings, admin | 3 | high | — |
| TASK-0139 | Auditoria pt-BR: marketplace, profile, friends, feed | 3 | high | — |
| TASK-0140 | Traduzir pagina /parameters para pt-BR | 3 | high | — |
| TASK-0141 | Centralizar formatadores pt-BR (datas, horas, moedas) | 3 | high | — |
| TASK-0142 | EmptyState: variante compacta size="sm" | 2 | medium | — |
| TASK-0143 | AlertList: prop emptyDescription configuravel | 1 | low | — |
| TASK-0144 | Testes: equipment-store + equipment/page.tsx | 3 | medium | — |

**Total de Pontos**: 21

## Dependencias

```
TASK-0141 (formatadores)
    |
    +-> TASK-0137 (auditoria auth/dashboard/aquariums)
    |
    +-> TASK-0138 (auditoria alerts/devices/settings/admin)
    |
    +-> TASK-0139 (auditoria marketplace/profile/friends/feed)
    |
    +-> TASK-0140 (traduzir /parameters)

TASK-0142 (EmptyState sm) — independente
TASK-0143 (AlertList) — independente
TASK-0144 (testes equipment) — independente
```

## Padroes a Seguir

- Glossario pt-BR: "Entrar", "Salvar", "Excluir", "Cancelar", "Nenhum registro encontrado", "Carregando..."
- Datas: `dd/MM/yyyy HH:mm` (pt-BR locale)
- Moedas: `R$ 1.234,56` (Intl.NumberFormat pt-BR)
- Nenhuma palavra em ingles visivel ao usuario (exceto termos tecnicos: pH, ORP, TDS, MQTT, ESP32)

## Criterios de Aceite da Sprint

- [x] Nenhum texto em ingles nas telas do sistema (exceto termos tecnicos)
- [x] Datas formatadas em padrao brasileiro em todo o frontend
- [x] Valores monetarios com R$ e separadores corretos
- [x] Pagina /parameters 100% em pt-BR
- [x] Formatadores centralizados em `lib/formatters.ts`
- [x] EmptyState com variante size="sm" funcionando no aquarium-switcher
- [x] AlertList aceita emptyDescription customizada
- [x] Equipment store e page com cobertura de testes

## Plano Operacional de Seguranca (2026-02-16)

### 1) Ordem de Revisao (gate por dependencia)

1. `TASK-0141` (formatadores)
2. `TASK-0140` (pagina `/parameters`)
3. `TASK-0137` (auth/dashboard/aquariums)
4. `TASK-0138` (alerts/devices/settings/admin)
5. `TASK-0139` (marketplace/profile/friends/feed)
6. `TASK-0142` (EmptyState `size="sm"`)
7. `TASK-0143` (AlertList `emptyDescription`)
8. `TASK-0144` (testes equipment)

### 2) Gate Minimo por Card (antes de `review -> done`)

- Evidencia objetiva no card (`Notas de Progresso`) com o que foi alterado
- Resultado de teste relevante (unitario/integracao) para o escopo alterado
- Sem regressao visivel de i18n pt-BR no modulo afetado
- `assigned_to: null` no momento de conclusao
- Registro no `logs/activity.jsonl` e transicao canonica de coluna

### 3) Regras de Seguranca de Execucao

- Nao revisar por diff parcial; revisar por escopo funcional da tarefa
- Nao aprovar card com checklist marcado sem evidencia tecnica minima
- Nao misturar fechamento de sprint com refactors fora do escopo
- Se houver duvida de regressao, retornar `review -> in-progress` com motivo explicito

### 4) Riscos Atuais e Mitigacao

- Risco: arvore de trabalho local com muitas mudancas simultaneas
  Mitigacao: validar por card (escopo fechado), evitando aprovacoes em lote
- Risco: inconsistencias de metadados entre colunas e frontmatter
  Mitigacao: checagem de `assigned_to`, `acted_by` e log antes de cada move
- Risco: criterio de i18n aprovado sem cobertura de testes
  Mitigacao: exigir evidencia de testes por modulo e smoke check manual

### 5) Definicao de Fluxo Seguro para Encerramento

- Sprint so encerra quando 8/8 cards de `sprint-017` estiverem em `board/done/`
- Qualquer reprovacao em review reabre o card (`review -> in-progress`) no mesmo dia
- Sem novos cards na sprint atual (capacidade ja preenchida em 21 pontos)

### [2026-02-16 17:13] codex
Revisao tecnica da sprint executada com gate de seguranca: cards `TASK-0137` a `TASK-0144` aprovados e movidos para `done` apos evidencia em codigo e suite de testes verde (`npm run test`: 263/263).
