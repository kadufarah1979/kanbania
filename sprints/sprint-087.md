---
id: sprint-087
title: "Sprint 87 - Setup Wizard (setup.sh)"
project: kanbania
goal: "Construir o setup wizard completo: quick mode, detailed mode e flags --from-config e --upgrade"
start_date: "2026-07-01"
end_date: "2026-07-14"
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

Construir o setup.sh que permite que qualquer pessoa configure o Kanbania em menos de 2 minutos. Quick mode gera config.yaml com defaults e estrutura de board. Detailed mode configura agentes, colunas, projetos e notificacoes interativamente. Flags permitem regeneracao e upgrade a partir de config existente.

## Tarefas Planejadas

| ID | Titulo | SP | Prioridade |
|----|--------|----|------------|
| TASK-0629 | Criar setup.sh — esqueleto e quick mode | 3 | high |
| TASK-0630 | setup.sh — detailed mode: owner e agents | 3 | high |
| TASK-0631 | setup.sh — detailed mode: columns e projects | 3 | high |
| TASK-0632 | setup.sh — detailed mode: notifications e geracao final | 3 | high |
| TASK-0633 | setup.sh — flags --from-config e --upgrade | 3 | medium |
| TASK-0634 | Testar setup.sh — quick mode em diretorio vazio | 2 | high |
| TASK-0635 | Testar setup.sh — detailed mode completo | 2 | high |

**Total de Pontos**: 19 / 21

## OKRs Vinculados

- OKR-2026-Q2-04: Setup wizard e launch open-source — contribui para KR-02 e KR-03

## Notas de Execucao

- TASK-0629 deve ser concluida antes de TASK-0630, 0631, 0632, 0633
- TASK-0630, 0631, 0632 podem rodar em paralelo apos TASK-0629
- TASK-0633 pode rodar em paralelo com 0630-0632
- TASK-0634 depende de TASK-0629
- TASK-0635 depende de TASK-0630, 0631, 0632, 0633
- Dependencia externa: TASK-0623-0626 (templates) devem estar concluidos antes de TASK-0632

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Metricas
- **Pontos planejados**: 19
- **Pontos entregues**: {N}
- **Velocidade**: {N} pts/sprint
- **Taxa de conclusao**: {N}%
