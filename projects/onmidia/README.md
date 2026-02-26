---
id: onmidia
name: "OnMidia"
description: "Infraestrutura AWS multi-ambiente do projeto OnMidia gerenciada via Terraform"
repo: "/home/carlosfarah/Projects/IaC/OnMidia"
tech_stack:
  - terraform
  - aws
status: active
created_at: "2026-02-19T14:45:00-03:00"
created_by: claude-code
---

## Visao Geral

Projeto de Infrastructure as Code (IaC) para o sistema OnMidia (Amazonas Inovare). Gerencia infraestrutura AWS em multiplos ambientes usando Terraform com modulos reutilizaveis e stages isolados.

## Escopo

### Incluido
- Provisionamento de infraestrutura AWS (VPC, EC2, ASG, ALB, S3, IAM, IoT, Route53, ACM, Secrets Manager)
- Configuracao por ambiente via stages independentes (dev, hml, qa, prd)
- Modulos Terraform reutilizaveis em `IaC/modules/`
- Configuracao compartilhada em `IaC/stage/common/`
- Scripts de automacao em `IaC/scripts/`
- Documentacao e relatorios em `docs/`

### Excluido
- Codigo-fonte do backend, frontend e mobile (apenas IaC)
- Deploy de aplicacao (CI/CD do app)

## Arquitetura

```
IaC/
├── stage/
│   ├── common/     # Configuracao compartilhada entre stages
│   ├── dev/        # Ambiente de desenvolvimento
│   ├── hml/        # Ambiente de homologacao
│   ├── qa/         # Ambiente de QA
│   └── prd/        # Ambiente de producao
├── modules/        # Modulos Terraform reutilizaveis
├── scripts/        # Scripts de automacao
├── certs/          # Certificados
└── docs/           # Documentacao IaC
```

- State remoto: S3 + DynamoDB
- Regiao AWS: us-east-1

## Setup do Ambiente

```bash
# Navegar para o stage desejado
cd IaC/stage/<stage>

# Inicializar Terraform
terraform init

# Validar configuracao
terraform validate

# Planejar mudancas
terraform plan
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/OnMidia`
- Portal PRD: https://portal.onmidia.amazonasinovare.com.br
- SSH: ver `docs/ssh-access.md`

## OKRs Vinculados

{Vincular OKRs quando definidos}

## Notas

- AWS profiles por stage em `~/.aws/credentials`
- Terraform livre: init, plan, validate, fmt, import, state
- Terraform com aprovacao: apply, destroy
