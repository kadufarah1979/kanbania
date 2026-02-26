---
id: mdm-terraform
name: "MDM - Infrastructure as Code (Terraform)"
description: "Infraestrutura AWS multi-ambiente do projeto MDM gerenciada via Terraform"
repo: "/home/carlosfarah/Projects/IaC/MDM/terraform"
tech_stack:
  - terraform
  - aws
  - nodejs
  - react
  - python
  - bash
status: active
created_at: "2026-02-13T12:00:00-03:00"
created_by: claude-code
---

## Visao Geral

Projeto de Infrastructure as Code (IaC) para o sistema MDM (Master Data Management).
Gerencia infraestrutura AWS em multiplos ambientes (dev, hml, qa, prd, cielo) usando
Terraform com modulos reutilizaveis e stages isolados por conta AWS.

## Escopo

### Incluido
- Provisionamento de infraestrutura AWS (VPC, EC2, ASG, ALB, RDS, MSK, Route53, S3, IAM, IoT)
- Configuracao por ambiente via stages independentes
- Scripts de automacao (cleanup, validacao, destruicao)
- 28 modulos Terraform reutilizaveis

### Excluido
- Codigo aplicacional (APIs, frontends)
- Configuracao de aplicacoes (Keycloak, Kong, etc.)
- Pipelines CI/CD (Atlantis gerencia separadamente)

## Arquitetura

```
stage/
  dev/   -> Conta 654654296472 (Desenvolvimento)
  hml/   -> Conta 980921748409 (Homologacao)
  qa/    -> Conta QA
  prd/   -> Conta Producao
  cielo/ -> Conta Parceiro
  common/ -> Configuracoes compartilhadas

modules/ -> 28 modulos reutilizaveis (vpc, alb, ec2, rds, msk, iam, etc.)
scripts/ -> cleanup_aws.py, infra_validator.py, resource_destroyer.py
```

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/IaC/MDM/terraform/stage/<env>
terraform init
terraform plan
terraform apply
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/MDM/terraform`
- Backend S3: `tectoy-tfstate`
- State Paths: `mdm/stage/{env}/terraform.tfstate`

## Contas AWS

| Ambiente | Account ID     | Profile  |
|----------|----------------|----------|
| dev      | 654654296472   | MDM-DEV  |
| hml      | 980921748409   | MDM-HML  |
| devops   | 887998201781   | devops   |

## Notas

- Modulos nao devem ser alterados sem revisao
- Sempre usar `terraform fmt -recursive` antes de commits
- Seguir conventional commits (feat:, fix:, chore:)
- Secrets apenas via AWS Secrets Manager
