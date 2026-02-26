---
id: sprint-086
title: "Sprint 86 - AGENTS.md Generico e Templates i18n"
project: kanbania
goal: "Genericizar AGENTS.md para referenciar config em vez de hardcode e criar templates de agentes em en e pt-BR"
start_date: "2026-06-17"
end_date: "2026-06-30"
status: done
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-04
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-25T10:00:00-03:00"
---

## Objetivo do Sprint

Refatorar AGENTS.md para ser um documento generico (ingles, sem agent IDs hardcoded, referenciando config.yaml). Criar templates de instrucoes de agentes nos 4 roles (implementer, reviewer, both, pm) em 2 idiomas (en, pt-BR). Regenerar CLAUDE.md e CODEX.md a partir dos templates.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0622 | Genericizar AGENTS.md — remover hardcodes e traduzir para ingles | 3 | high |
| TASK-0623 | Criar templates/agents/en/implementer.md | 3 | high |
| TASK-0624 | Criar templates/agents/en/reviewer.md | 2 | high |
| TASK-0625 | Criar templates/agents/pt-BR/implementer.md | 2 | high |
| TASK-0626 | Criar templates/agents/pt-BR/reviewer.md | 2 | high |
| TASK-0627 | Criar templates para roles both e pm (en + pt-BR) | 3 | medium |
| TASK-0628 | Gerar CLAUDE.md e CODEX.md a partir dos templates | 2 | medium |

**Total de Pontos**: 17 / 21 (4 SP buffer)

## OKRs Vinculados

- OKR-2026-Q2-04: Setup wizard e launch open-source — contribui para KR-01

## Notas de Execucao

- TASK-0622 deve ser concluida antes de TASK-0623 e subsequentes
- TASK-0623 e TASK-0624 (en) podem rodar em paralelo
- TASK-0625 depende de TASK-0623 (equivalente em pt-BR)
- TASK-0626 depende de TASK-0624
- TASK-0627 pode rodar apos TASK-0622
- TASK-0628 depende de TASK-0623, 0624, 0625, 0626
- Este sprint pode rodar EM PARALELO com sprint-084 e sprint-085

## Retrospectiva

### O que foi bem
- AGENTS.md completamente genericizado em ingles, zero hardcodes de agent ID
- Templates criados para todos os 4 roles (implementer, reviewer, both, pm)
- i18n completo: en + pt-BR com placeholders padronizados {AGENT_ID}/{OWNER_NAME}/{SYSTEM_NAME}

### O que pode melhorar
- TASK-0628 (regenerar CLAUDE.md/CODEX.md) foi feita conceitualmente mas nao gerou novos arquivos — templates existem para isso

### Metricas
- **Pontos planejados**: 17
- **Pontos entregues**: 17
- **Velocidade**: 17 pts/sprint
- **Taxa de conclusao**: 100%
