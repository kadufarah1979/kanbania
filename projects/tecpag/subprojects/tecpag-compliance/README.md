---
id: tecpag-compliance
name: "TecPag - Compliance"
description: "Automacao de conformidade PCI-DSS v4.0 com 14 requisitos mapeados e geracao de relatorios"
repo: "/home/carlosfarah/Projects/IaC/TecPag/scripts/pci-compliance-automation"
tech_stack:
  - python
  - aws
  - pci-dss-v4
status: active
created_at: "2026-02-23T12:30:00-03:00"
created_by: claude-code
parent_project: tecpag
---

## Visao Geral

Subprojeto responsavel pela automacao de testes de conformidade PCI-DSS v4.0.
Implementa verificacoes automatizadas contra 14 requisitos PCI, gerando relatorios em Markdown, JSON e CSV com score, metricas e acoes prioritarias.

## Escopo

### Incluido
- pci-compliance-automation (Python)
- 14 checkers PCI-DSS v4.0 (1 implementado, 13 stubs pendentes)
- Geracao de relatorios: MD, JSON, CSV
- Analise de: Security Groups, NACLs, WAF, Config, IAM, logs CloudTrail
- Integracao CI/CD (GitLab pipeline)
- Backup automatico de relatorios
- Mapeamento config/requirements_mapping.json

### Excluido
- Implementacao dos controles tecnicos em si (tecpag-iac)
- Operacao dos servicos (tecpag-devops)
- Desenvolvimento de features (tecpag-source)

## Arquitetura

```
pci-compliance-automation/
├── main.py                         # Orquestrador principal
├── config/
│   └── requirements_mapping.json  # Mapeamento 14 requisitos PCI
├── modules/
│   ├── req_01_checker.py          # IMPLEMENTADO
│   ├── req_02_checker.py          # stub
│   ├── ...                        # stubs (req 03 a 14)
│   └── req_14_checker.py          # stub
├── templates/
│   └── checker_template.py        # Template para novos checkers
└── reports/                       # Saida: MD, JSON, CSV
```

**Score atual: ~68.5%** | Checkers implementados: 1/14

## Gaps por Prioridade

| Prioridade | Requisito | Status |
|------------|-----------|--------|
| Critica    | Req 3 — Protecao de dados em repouso | GAP |
| Critica    | Req 11 — Testes de penetracao | GAP |
| Critica    | Req 13 — Gestao de vulnerabilidades | GAP |
| Alta       | Req 5 — Protecao contra malware | GAP |
| Alta       | Req 6 — Sistemas e software seguros (SAST/DAST) | GAP |

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/IaC/TecPag/scripts/pci-compliance-automation
pip install -r requirements.txt

# Executar verificacao completa
python main.py --stage prd

# Dry-run (sem acesso AWS)
python main.py --dry-run
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/Projects/IaC/TecPag/scripts/pci-compliance-automation`
- Scripts: `/home/carlosfarah/Projects/IaC/TecPag/scripts`
- REPORTS: `/home/carlosfarah/Projects/IaC/TecPag/REPORTS`
- Analise seguranca PCI: `/home/carlosfarah/Projects/IaC/TecPag/DevOps/docs/02-ANALISE-SEGURANCA-PCI.md`
- Projeto legado: `/home/carlosfarah/kanbania/projects/tecpag-pci`

## OKRs Vinculados

- {Vincular OKRs quando definidos — sugerido: OKR de atingir 85% conformidade PCI em Q1 2026}

## Notas

Subprojeto do projeto pai `tecpag`. Board proprio em `subprojects/tecpag-compliance/board/`.
Este subprojeto absorve o escopo de compliance do projeto legado `tecpag-pci`.
Prioridade: implementar os 13 checkers restantes comecando pelos de criticidade maxima (Req 3, 11, 13).
