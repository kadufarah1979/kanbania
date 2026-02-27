---
id: innovaq
name: "INNOVAQ"
description: "Plataforma de inovacao e automacao"
repo: "/home/carlosfarah/Projects/IaC/Innovaq"
tech_stack:
  - node
  - react
  - aws
status: active
created_at: "2026-02-27T11:58:00-03:00"
created_by: claude-code
---

## Visao Geral

Plataforma fullstack de inovacao e automacao, composta por APIs backend (Node.js), frontend (React) e infraestrutura AWS gerenciada via Terraform. Ambientes isolados por stage: dev, hml, qa e prd.

## Escopo

### Incluido

- Infraestrutura AWS (VPC, EC2, ASG, ALB, NLB, S3, IAM, Route53, ACM, Secrets Manager, MongoDB)
- APIs backend (Node.js): innovaq-api, api-acl, api-base, api-mailer, api-orchestrator, api-host, api-assets, api-ia
- Frontend (React): innovaq-ui, frontend
- Configuracao por ambiente via stages independentes (dev, hml, qa, prd)
- Automacao e DevOps (devops/backend, devops/frontend, devops/database)

### Excluido

- {Descrever o que NAO faz parte do projeto}

## Arquitetura

```
Innovaq/
├── automacao/
├── backend/
│   ├── api-acl/
│   ├── api-base/
│   ├── api-gatewaykong/
│   ├── api-host/
│   ├── api-mailer/
│   ├── api-orchestrator/
│   ├── apiassets/
│   ├── apiacl/
│   ├── institucional/
│   ├── innovaq-api/
│   ├── innovaq-ia/
│   ├── modular-tools/
│   ├── safety-api/
│   └── taskmigrationatomation/
├── devops/
│   ├── backend/
│   ├── database/
│   └── frontend/
├── frontend/
│   ├── frontend/
│   └── innovaq-ui/
└── iac/
    └── terraform/
        └── stage/
            ├── dev/
            ├── hml/
            ├── qa/
            └── prd/
```

- AWS Region: us-east-1
- Instancias: t4g (burstable), MongoDB em EC2 (t4g.large, 300GB)
- Load Balancers: ALB publico + ALB interno + NLB publico

## Setup do Ambiente

```bash
# IaC - Terraform
cd iac/terraform/stage/<stage>
terraform init
terraform validate
terraform plan

# AWS Profile por stage
export AWS_PROFILE=INNOVAQ-PRD  # ou INNOVAQ-DEV etc.
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/Innovaq`
- GitLab: `https://git.lab.tectoylabs.com.br/innovaq`

## OKRs Vinculados

{Vincular OKRs quando definidos}

## Notas

- AWS profile de producao: `INNOVAQ-PRD` (account: 189958392649, user: automation)
- SSH GitLab: `ssh.git.lab.tectoylabs.com.br:2223`
- MongoDB autogerenciado em EC2 (nao RDS/DocumentDB)
