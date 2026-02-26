---
id: tecpag-source
name: "TecPag - Source"
description: "Codigo-fonte dos 7 microsservicos de gateway e plataforma de pagamentos TecPag"
repo: "/home/carlosfarah/Projects/IaC/TecPag/Source"
tech_stack:
  - docker
  - postgresql
  - mongodb
  - rabbitmq
  - redis
status: active
created_at: "2026-02-23T12:30:00-03:00"
created_by: claude-code
parent_project: tecpag
---

## Visao Geral

Subprojeto responsavel pelo codigo-fonte de todos os microsservicos da plataforma TecPag.
Cobre 7 gateways especializados por modalidade de pagamento, a plataforma central e o frontend.

## Escopo

### Incluido
- gateway-domain (9 modulos)
- gateway-api (7 modulos)
- gatewaypix — processamento de transacoes PIX
- gatewayonline — processamento online
- gatewaypresencial — processamento presencial
- plataforma — nucleo central de processamento
- Frontend — interface web

### Excluido
- Infraestrutura de provisionamento (tecpag-iac)
- Configuracoes Docker Compose / orquestracao (tecpag-devops)
- Automacao de compliance PCI (tecpag-compliance)

## Arquitetura

```
Source/
├── gateway-domain/     # Gateway de dominio (9 modulos)
├── gateway-api/        # Gateway de API (7 modulos)
├── gatewaypix/         # Gateway PIX
├── gatewayonline/      # Gateway Online
├── gatewaypresencial/  # Gateway Presencial
├── plataforma/         # Plataforma central
└── Frontend/           # Interface web
```

**Fluxo de transacao:**
```
Cliente → ALB → gateway-api/gateway-domain → plataforma
                      ↓ async
                   RabbitMQ → consumers (plataforma)
                      ↓ cache
                    Redis
                      ↓ persist
              PostgreSQL + MongoDB
```

## Setup do Ambiente

```bash
# Clonar repositorios dos microsservicos
# (via script_projects.sh ou manualmente)
cd /home/carlosfarah/Projects/IaC/TecPag/Source/<microsservico>
# seguir README especifico do servico
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/TecPag/Source`

## OKRs Vinculados

- {Vincular OKRs quando definidos}

## Notas

Subprojeto do projeto pai `tecpag`. Board proprio em `subprojects/tecpag-source/board/`.
