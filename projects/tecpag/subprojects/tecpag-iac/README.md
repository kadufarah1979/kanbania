---
id: tecpag-iac
name: "TecPag - IaC"
description: "Infraestrutura como codigo via Terraform para todos os recursos AWS do ecossistema TecPag"
repo: "/home/carlosfarah/Projects/IaC/TecPag/IaC"
tech_stack:
  - terraform
  - aws
  - bash
status: active
created_at: "2026-02-23T12:30:00-03:00"
created_by: claude-code
parent_project: tecpag
---

## Visao Geral

Subprojeto responsavel pelo provisionamento e evolucao de toda a infraestrutura AWS do TecPag via Terraform.
Cobre 4 ambientes (`dev`, `qa`, `hml`, `prd`) com 20+ modulos especializados e hardening aplicado via scripts de provisionamento em cadeia.

## Escopo

### Incluido
- Modulos Terraform: IAM, security-groups, launch_templates, certificates, S3, ALB, NLB, autoscaling, Route53, Secrets Manager, bastion-access, AMI
- Configuracao de ambientes dev, qa, hml, prd
- Scripts de provisionamento (script_base.sh, ami-user-data-creation.sh, config-aws-*.sh, script_project.sh, script_projects.sh, script_service.sh)
- Hardening de instancias EC2 (auditd, fail2ban, Docker, AWS CLI, Zabbix Agent)
- Gestao de AMIs customizadas

### Excluido
- Codigo-fonte dos microsservicos (tecpag-source)
- Configuracoes Docker Compose de servicos (tecpag-devops)
- Automacao de compliance PCI (tecpag-compliance)

## Arquitetura

```
IaC/
├── stages/
│   ├── common/         # Recursos compartilhados entre ambientes
│   ├── dev/
│   ├── qa/
│   ├── hml/
│   └── prd/
└── modules/
    ├── iam/
    ├── security-groups/
    ├── launch_templates/
    ├── certificates/
    ├── s3/
    ├── app_load_balance/
    ├── net_load_balance/
    ├── autoscaling/
    ├── route53/
    ├── secrets-manager/
    ├── bastion-access/
    └── ami/
```

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/IaC/TecPag/IaC/stages/<stage>
terraform init
terraform validate
terraform plan
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/TecPag/IaC`
- Documentacao PRD: `/home/carlosfarah/Projects/IaC/TecPag/IaC/Documentacao-TECPAG-PRD.pdf`

## OKRs Vinculados

- {Vincular OKRs quando definidos}

## Notas

Subprojeto do projeto pai `tecpag`. Board proprio em `subprojects/tecpag-iac/board/`.
Tarefas de IaC existentes no projeto `tecpag-pci` serao migradas progressivamente para este subprojeto.
