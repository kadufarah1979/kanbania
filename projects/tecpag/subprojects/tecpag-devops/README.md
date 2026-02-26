---
id: tecpag-devops
name: "TecPag - DevOps"
description: "Orquestracao de servicos via Docker Compose para o ecossistema TecPag"
repo: "/home/carlosfarah/Projects/IaC/TecPag/DevOps"
tech_stack:
  - docker
  - postgresql
  - mongodb
  - rabbitmq
  - redis
  - elasticsearch
  - zabbix
status: active
created_at: "2026-02-23T12:30:00-03:00"
created_by: claude-code
parent_project: tecpag
---

## Visao Geral

Subprojeto responsavel pela orquestracao de todos os servicos de infraestrutura via Docker Compose.
Gerencia o ciclo de vida dos containers de banco de dados, mensageria, cache e observabilidade em cada ambiente.

## Escopo

### Incluido
- Docker Compose configs para todos os servicos
- gateway, plataforma, frontend (configs de deploy)
- MongoDB, PostgreSQL, RabbitMQ, Redis
- Stack de telemetria: Zabbix + ELK (Elasticsearch, Logstash, Kibana)
- Documentacao de analise: funcional, seguranca PCI, infraestrutura, plano de melhorias

### Excluido
- Codigo-fonte dos microsservicos (tecpag-source)
- Provisionamento AWS / Terraform (tecpag-iac)
- Automacao de compliance PCI (tecpag-compliance)

## Arquitetura

```
DevOps/
├── gateway/            # API Gateway config
├── plataforma/
│   └── ms-domain-process-acquirer/
├── frontend/
├── mongo/              # MongoDB Docker Compose
├── pgsql/              # PostgreSQL Docker Compose
├── rabbitmq/           # RabbitMQ Docker Compose
├── redis/              # Redis Docker Compose
├── telemetry/          # Zabbix + ELK
├── analysis-prompts/   # Prompts de analise estruturada
└── docs/
    ├── 01-ANALISE-FUNCIONAL.md
    ├── 02-ANALISE-SEGURANCA-PCI.md
    ├── 03-ANALISE-INFRAESTRUTURA.md
    └── 04-PLANO-MELHORIAS.md
```

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/IaC/TecPag/DevOps/<servico>
docker compose up -d
docker compose logs -f
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/TecPag/DevOps`
- Analise funcional: `docs/01-ANALISE-FUNCIONAL.md`
- Analise seguranca: `docs/02-ANALISE-SEGURANCA-PCI.md`
- Plano de melhorias: `docs/04-PLANO-MELHORIAS.md`

## OKRs Vinculados

- {Vincular OKRs quando definidos}

## Notas

Subprojeto do projeto pai `tecpag`. Board proprio em `subprojects/tecpag-devops/board/`.
