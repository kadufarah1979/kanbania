---
id: sprint-088
title: "Sprint 88 - Limpeza Final e Launch Open-Source"
project: kanbania
goal: "Grep zero em todo o repo, artefatos de launch (LICENSE, CONTRIBUTING, templates GitHub) e teste e2e em Ubuntu limpo"
start_date: "2026-07-15"
end_date: "2026-07-28"
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

Sprint de finalizacao. Varredura global de residuais hardcoded (grep zero), criacao de todos os artefatos necessarios para publicacao open-source (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, issue templates, PR template), atualizacao do README e teste end-to-end em ambiente Ubuntu limpo.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0601 | Validacao final dos scripts — grep zero | 2 | high |
| TASK-0636 | Grep final e correcao de residuais em scripts e dashboard | 3 | high |
| TASK-0637 | Criar LICENSE (MIT) | 1 | high |
| TASK-0638 | Criar CONTRIBUTING.md | 2 | high |
| TASK-0639 | Criar CODE_OF_CONDUCT.md | 1 | medium |
| TASK-0640 | Criar issue templates (.github/ISSUE_TEMPLATE/) | 2 | medium |
| TASK-0641 | Criar PR template | 1 | medium |
| TASK-0642 | Atualizar README.md — badges, quickstart e URLs finais | 2 | high |
| TASK-0643 | Teste e2e — clone, setup, fluxo completo em Ubuntu limpo | 3 | high |

**Total de Pontos**: 17 / 21 (4 SP buffer para correcoes de residuais)

## OKRs Vinculados

- OKR-2026-Q2-04: Setup wizard e launch open-source — contribui para KR-04

## Notas de Execucao

- TASK-0601 depende de todos os sprints de scripts (082, 083) concluidos
- TASK-0636 depende de todos os sprints anteriores (082-087)
- TASK-0637 a TASK-0641 sao independentes, podem rodar em paralelo desde o inicio
- TASK-0642 depende de TASK-0637
- TASK-0643 depende de TASK-0629 (setup.sh) e TASK-0634 (teste quick mode)
- Criterio de saida: grep -r '/home/' scripts/ dashboard/src/ = zero + teste e2e passando

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 17
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
