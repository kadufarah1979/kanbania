---
id: sprint-023
title: "Sprint 23 — Terraform HML & Pendencias Operacionais"
goal: "Reconstruir infraestrutura Terraform do ambiente HML (mdm-terraform) e revalidar SSL/SecurityHeaders do Aquario"
start_date: "2026-02-18"
end_date: "2026-03-04"
status: completed
project: mdm-terraform
capacity: 21
created_by: claude-code
okrs: []
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-18T10:00:00-03:00"
---

## Objetivo do Sprint

Reconstruir a infraestrutura Terraform do ambiente HML do projeto mdm-terraform, passando por mapeamento de diferencas, cleanup AWS, reescrita de configuracoes e execucao de plan/apply. Paralelamente, concluir a revalidacao de SSL Labs e SecurityHeaders do Aquario (pendencia das sprints anteriores).

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0001 | Mapear diferencas entre stage/dev e stage/hml | 2 | high | claude-code |
| TASK-0002 | Executar cleanup_aws.py na conta HML | 3 | critical | claude-code |
| TASK-0003 | Limpar Terraform state do HML | 1 | high | claude-code |
| TASK-0004 | Reescrever arquivos de configuracao base do HML | 3 | high | claude-code |
| TASK-0005 | Reescrever locals e modules.tf do HML espelhando DEV | 8 | high | claude-code |
| TASK-0006 | Executar terraform init, validate e plan | 2 | high | claude-code |
| TASK-0007 | Revisar plan e executar terraform apply | 2 | high | claude-code |
| TASK-0162 | Revalidar SSL Labs e SecurityHeaders apos 25-02 | 2 | medium | — |

**Total de Pontos**: 23 / 21 (ligeiramente acima da capacidade; TASK-0162 pode ser adiada se necessario)

## Dependencias

```
TASK-0001
  |
  +-> TASK-0004
  +-> TASK-0005

TASK-0002
  |
  +-> TASK-0003

TASK-0003 + TASK-0004 + TASK-0005
  |
  +-> TASK-0006
        |
        +-> TASK-0007

TASK-0162 — independente (aquario)
```

## OKRs Vinculados

- Nenhum OKR formal vinculado (TASK-0001..0007 sao do projeto mdm-terraform)
- OKR-2026-Q1-01: TASK-0162 (pendencia operacional Aquario)

## Criterios de Aceite da Sprint

- [ ] Diferencas dev/hml mapeadas e documentadas
- [ ] Recursos AWS antigos do HML removidos via cleanup_aws.py
- [ ] Terraform state do HML limpo e pronto para reimport
- [ ] Configuracoes base e modules reescritos espelhando DEV
- [ ] terraform plan executado sem erros criticos
- [ ] terraform apply executado com sucesso no HML
- [ ] SSL Labs e SecurityHeaders do Aquario revalidados com nota A/A+

## Retrospectiva

_(a preencher ao final da sprint)_
