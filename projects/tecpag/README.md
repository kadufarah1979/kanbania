---
id: tecpag
name: "TecPag"
description: "Ecossistema de infraestrutura como codigo e conformidade PCI-DSS v4.0 para plataforma de pagamentos"
repo: "/home/carlosfarah/Projects/IaC/TecPag"
tech_stack:
  - terraform
  - aws
  - docker
  - python
  - bash
  - postgresql
  - mongodb
  - rabbitmq
  - redis
  - pci-dss-v4
status: active
created_at: "2026-02-23T12:30:00-03:00"
created_by: claude-code
---

## Sumario

- [O que e o TecPag](#o-que-e-o-tecpag)
- [Arquitetura Geral](#arquitetura-geral)
- [Stack Tecnologica](#stack-tecnologica)
- [Sub-projetos](#sub-projetos)
- [Gaps PCI-DSS v4.0](#gaps-pci-dss-v40)
- [OKRs Ativos](#okrs-ativos)
- [Decisoes de Arquitetura](#decisoes-de-arquitetura)
- [Riscos e Pendencias](#riscos-e-pendencias)
- [Links e Referencias](#links-e-referencias)

---

## O que e o TecPag

**TecPag** e um ecossistema completo de infraestrutura para uma plataforma de pagamentos com conformidade **PCI-DSS v4.0**.

O projeto abrange desde o provisionamento de recursos AWS via Terraform ate a orquestracao de 7 microsservicos de gateway (PIX, online, presencial, dominio, API, plataforma e frontend), passando por hardening de seguranca, monitoramento com Zabbix + ELK, e automacao de testes de conformidade PCI.

**Contexto:**
- Plataforma que processa transacoes de pagamento em diferentes modalidades (PIX, online, presencial)
- Ambiente de producao com requisitos de certificacao PCI-DSS v4.0
- Infraestrutura 100% em AWS, provisionada como codigo (Terraform)
- 4 ambientes gerenciados: `dev`, `qa`, `hml`, `prd`

---

## Arquitetura Geral

```
                        ┌─────────────────────────────────────────────┐
                        │                   AWS Cloud                  │
                        │                                              │
  Users/Partners ──────►│  ALB (Application Load Balancer)            │
                        │    │                                         │
                        │    ├──► gateway-api      ──► plataforma     │
                        │    ├──► gateway-domain   ──► plataforma     │
                        │    ├──► gatewaypix       ──► plataforma     │
                        │    ├──► gatewayonline    ──► plataforma     │
                        │    └──► gatewaypresencial──► plataforma     │
                        │                │                             │
                        │         ┌──────┴───────┐                    │
                        │         │              │                     │
                        │      PostgreSQL      MongoDB                 │
                        │         │              │                     │
                        │       RabbitMQ  ◄──────┘                    │
                        │         │                                    │
                        │       Redis (cache)                          │
                        │                                              │
                        │  Observabilidade: Zabbix + ELK Stack         │
                        │  Secrets: AWS Secrets Manager                │
                        │  DNS: Route53 + Transit Gateway              │
                        └─────────────────────────────────────────────┘
```

**Provisionamento (fluxo de scripts em cadeia):**
```
Terraform (IaC) → EC2 Launch Template → script_base.sh (hardening)
  → ami-user-data-creation.sh → config-aws-cli.sh (Secrets Manager)
  → config-aws-env.sh (Transit Gateway + hostname) → script_project.sh
  → script_projects.sh (clone repos + deploy) → script_service.sh (Docker Compose)
```

---

## Stack Tecnologica

| Camada           | Tecnologia                                                |
|------------------|-----------------------------------------------------------|
| IaC              | Terraform (20+ modulos)                                   |
| Cloud            | AWS: EC2, RDS, S3, Secrets Manager, Transit Gateway       |
|                  | ALB, NLB, Route53, IAM, ACM, WAF, CloudTrail              |
| Containerizacao  | Docker + Docker Compose                                   |
| Microsservicos   | 7 gateways + plataforma + frontend                        |
| Banco Relacional | PostgreSQL (RDS)                                          |
| Banco Documentos | MongoDB                                                   |
| Message Queue    | RabbitMQ                                                  |
| Cache            | Redis                                                     |
| Observabilidade  | Zabbix Agent + ELK Stack (Elasticsearch, Logstash, Kibana)|
| Compliance       | PCI-DSS v4.0 — automacao Python (14 requisitos mapeados)  |
| Scripting        | Bash (provisionamento), Python (compliance)               |

---

## Sub-projetos

O TecPag e gerenciado em 4 sub-projetos paralelos, cada um com board, sprints e OKRs proprios:

### [tecpag-iac](./subprojects/tecpag-iac/README.md)

Infraestrutura como codigo via Terraform. Responsavel pelo provisionamento e evolucao de todos os recursos AWS.

- **Escopo**: modulos Terraform, launch templates, hardening, ambientes dev/qa/hml/prd
- **Repo**: `/home/carlosfarah/Projects/IaC/TecPag/IaC`
- **Board**: `subprojects/tecpag-iac/board/`

### [tecpag-devops](./subprojects/tecpag-devops/README.md)

Orquestracao de servicos via Docker Compose. Gerencia o ciclo de vida dos containers em cada ambiente.

- **Escopo**: Docker Compose configs, servicos (mongo, pgsql, rabbitmq, redis, telemetry), integracao
- **Repo**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps`
- **Board**: `subprojects/tecpag-devops/board/`

### [tecpag-source](./subprojects/tecpag-source/README.md)

Codigo-fonte dos 7 microsservicos e frontend. Evolucao funcional da plataforma.

- **Escopo**: gateway-domain, gateway-api, gatewaypix, gatewayonline, gatewaypresencial, plataforma, Frontend
- **Repo**: `/home/carlosfarah/Projects/IaC/TecPag/Source`
- **Board**: `subprojects/tecpag-source/board/`

### [tecpag-compliance](./subprojects/tecpag-compliance/README.md)

Conformidade PCI-DSS v4.0. Automacao de testes, geracao de relatorios e rastreabilidade de controles.

- **Escopo**: pci-compliance-automation (Python), 14 requisitos, relatorios MD/JSON/CSV
- **Repo**: `/home/carlosfarah/Projects/IaC/TecPag/scripts/pci-compliance-automation`
- **Board**: `subprojects/tecpag-compliance/board/`

> **Nota**: O projeto `tecpag-pci` (existente no kanban) cobre IaC + PCI e pode ser migrado progressivamente para `tecpag-iac` + `tecpag-compliance`.

---

## Gaps PCI-DSS v4.0

Score atual estimado: **~68.5%** | Checkers implementados: **1/14** | Status geral: EM ANDAMENTO

| # | Requisito PCI-DSS v4.0                                | Status          | Prioridade | Notas                                      |
|---|-------------------------------------------------------|-----------------|------------|--------------------------------------------|
| 1 | Instalar e manter controles de seguranca de rede      | PARCIAL         | Alta       | Security Groups e NACLs configurados       |
| 2 | Nao usar senhas/configs padrao do fornecedor          | PARCIAL         | Alta       | Secrets Manager em uso, validar cobertura  |
| 3 | Proteger dados de conta armazenados                   | GAP             | Critica    | Criptografia em repouso a validar          |
| 4 | Proteger dados em transmissao com criptografia forte  | PARCIAL         | Alta       | ACM + TLS, mas sem validacao automatizada  |
| 5 | Proteger sistemas contra malware                      | GAP             | Alta       | Sem agente antimalware documentado         |
| 6 | Desenvolver e manter sistemas e software seguros      | GAP             | Alta       | Sem SAST/DAST no pipeline                  |
| 7 | Restringir acesso a componentes do sistema por need   | PARCIAL         | Media      | IAM configurado, revisar principio minimo  |
| 8 | Identificar usuarios e autenticar acesso              | PARCIAL         | Alta       | MFA parcial, sem politica documentada      |
| 9 | Restringir acesso fisico a dados de titular de cartao | N/A             | Baixa      | Cloud-only, AWS responsabilidade           |
| 10| Registrar e monitorar todo acesso a recursos          | IMPLEMENTADO    | Alta       | Zabbix + ELK + CloudTrail ativo            |
|11 | Testar seguranca de sistemas e redes regularmente     | GAP             | Critica    | Sem pentest documentado, sem DAST          |
|12 | Apoiar seguranca da informacao com politicas          | GAP             | Alta       | Politicas internas nao documentadas        |
|13 | Avaliar e gerenciar vulnerabilidades                  | GAP             | Critica    | Sem vulnerability scanning automatizado    |
|14 | Controles de acesso fisico para CHD                   | N/A             | Baixa      | Cloud-only, AWS responsabilidade           |

**Requisitos criticos (prioridade imediata):**
- Req. 3: Criptografia de dados em repouso
- Req. 11: Testes de penetracao regulares
- Req. 13: Gestao de vulnerabilidades automatizada

---

## OKRs Ativos

{Vincular OKRs quando definidos para 2026-Q1}

Sugestao de OKRs:
- **OKR-01**: Atingir 85% de conformidade PCI-DSS v4.0 ate final do Q1 2026
- **OKR-02**: Consolidar 100% dos modulos Terraform com documentacao e validacao
- **OKR-03**: Implementar 14/14 checkers de compliance automatizados

---

## Decisoes de Arquitetura

| Data       | Decisao                                         | Motivacao                                      |
|------------|-------------------------------------------------|------------------------------------------------|
| 2025-11    | Terraform como IaC exclusivo                    | Padronizacao, auditabilidade, drift detection  |
| 2025-11    | Docker Compose para orquestracao (nao Kubernetes)| Simplicidade operacional no estagio atual      |
| 2025-12    | AWS Secrets Manager para secrets                | Rotacao automatica, auditoria, IAM integration |
| 2025-12    | Zabbix + ELK para observabilidade               | Requisito PCI Req. 10 (logging centralizado)   |
| 2026-02    | Sub-projetos separados por dominio no kanban    | Autonomia de planejamento por area              |

---

## Riscos e Pendencias

| Risco / Pendencia                          | Impacto  | Acao Necessaria                             |
|--------------------------------------------|----------|---------------------------------------------|
| 13 de 14 checkers PCI sao stubs            | Critico  | Implementar checkers priorizando Req 3,11,13|
| Sem SAST/DAST no pipeline de CI/CD         | Alto     | Integrar tfsec + checkov no pipeline        |
| Politicas de seguranca nao documentadas    | Alto     | Criar e publicar politicas internas         |
| Sem teste de penetracao documentado        | Critico  | Agendar pentest e documentar escopo         |
| Migracao tecpag-pci → nova estrutura       | Medio    | Definir estrategia de migracao de tarefas   |
| Scripts de provisionamento sem versionamento semantico | Medio | Adicionar changelog e versionamento |

---

## Links e Referencias

- **Repositorio principal**: `/home/carlosfarah/Projects/IaC/TecPag`
- **IaC (Terraform)**: `/home/carlosfarah/Projects/IaC/TecPag/IaC`
- **DevOps**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps`
- **Source**: `/home/carlosfarah/Projects/IaC/TecPag/Source`
- **Scripts**: `/home/carlosfarah/Projects/IaC/TecPag/scripts`
- **PCI Automation**: `/home/carlosfarah/Projects/IaC/TecPag/scripts/pci-compliance-automation`
- **Docs analise funcional**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps/docs/01-ANALISE-FUNCIONAL.md`
- **Docs seguranca PCI**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps/docs/02-ANALISE-SEGURANCA-PCI.md`
- **Docs infra**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps/docs/03-ANALISE-INFRAESTRUTURA.md`
- **Plano de melhorias**: `/home/carlosfarah/Projects/IaC/TecPag/DevOps/docs/04-PLANO-MELHORIAS.md`
- **Projeto tecpag-pci (kanban legado)**: `/home/carlosfarah/kanbania/projects/tecpag-pci`

## Notas

Projeto criado em 2026-02-23 para rastreabilidade formal de todas as atividades do ecossistema TecPag.
Estruturado com 4 sub-projetos para permitir planejamento autonomo por dominio (IaC, DevOps, Source, Compliance).
O projeto `tecpag-pci` existente no kanban sera mantido ate a migracao completa das tarefas ativas.
