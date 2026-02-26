---
id: sprint-080
title: "Sprint 80 - Config Foundation"
project: kanbania
goal: "Criar scripts/lib/config.sh e expandir config.yaml com todas as secoes necessarias"
start_date: "2026-03-25"
end_date: "2026-04-07"
status: done
capacity: 21
created_by: "claude-code"
okrs:
  - OKR-2026-Q2-01
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-25T10:00:00-03:00"
---

## Objetivo do Sprint

Criar a fundacao que todo o restante do projeto open-source depende: a biblioteca `scripts/lib/config.sh` com 10+ funcoes utilitarias e a expansao do `config.yaml` com as secoes `system`, `workflow`, `projects`, `agents` (com role/color/exec), `git` e `notifications`. Este sprint e o gargalo critico — TASK-0572 bloqueia ~80% das tasks futuras.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0572 | Criar scripts/lib/config.sh | 3 | critical |
| TASK-0573 | Expandir config.yaml — secao system | 1 | high |
| TASK-0574 | Expandir config.yaml — secao workflow | 3 | high |
| TASK-0575 | Expandir config.yaml — secao projects | 2 | high |
| TASK-0576 | Expandir config.yaml — secao agents | 2 | high |
| TASK-0577 | Expandir config.yaml — secoes git e notifications | 1 | high |
| TASK-0578 | Criar config.local.yaml e adicionar ao .gitignore | 2 | high |
| TASK-0579 | Testar config.sh — script de unit tests | 2 | high |

**Total de Pontos**: 16 / 21 (5 SP buffer — TASK-0572 era 8 SP original, fatiada para 3)

## OKRs Vinculados

- OKR-2026-Q2-01: Criar fundacao de configuracao e migrar scripts simples — contribui para KR-01 e KR-02

## Notas de Execucao

- TASK-0572 deve ser a primeira a ser executada (bloqueia todas as outras)
- TASK-0573 a TASK-0578 podem rodar em paralelo apos TASK-0572
- TASK-0579 valida TASK-0572 e deve ser a ultima do sprint
- Dependencia do yq (binario Go) deve ser documentada no config.sh

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 16
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
