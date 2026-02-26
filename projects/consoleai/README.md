---
id: consoleai
name: "ConsoleAI"
description: "Plataforma de gestão operacional com IA para times de DevOps multi-tenant"
repo: "/home/carlosfarah/Projects/consoleai"
tech_stack:
  - python
  - streamlit
  - sqlite
  - aws
  - boto3
status: active
created_at: "2026-02-18T17:02:00-03:00"
created_by: codex
---

## Visão Geral

ConsoleAI é um sistema de gestão de operações DevOps com foco em governança multi-tenant por OU. A plataforma combina fluxo de solicitação/aprovação de tarefas com visualização de recursos AWS por tenant, priorizando segurança operacional e rastreabilidade.

## Escopo

### Incluído
- Gestão de usuários e papéis (DevOps, Desenvolvedor, Gestor)
- Associação de usuários a tenants (OUs)
- Solicitação de tarefas com aprovação de DevOps gestor
- Integração de tarefas aprovadas para Kanban
- Inventário de recursos AWS por tenant (domínio, LB, listener, TG, instâncias)
- Guardrail de produção: ambiente PRD somente leitura

### Excluído
- Provisionamento automático de infraestrutura
- Alterações destrutivas em recursos de produção
- Execução de mudanças sem aprovação explícita

## Arquitetura

Aplicação web com camada de autenticação/autorização multi-tenant, serviços de integração AWS via boto3 com escopo por tenant e módulo de workflow para solicitações operacionais. Persistência inicial em SQLite com trilha de auditoria para eventos críticos.

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/consoleai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run src/app.py
```

## Links e Referências

- Repositório: `/home/carlosfarah/Projects/consoleai`

## OKRs Vinculados

- Nenhum OKR vinculado ainda

## Notas

Projeto criado para evolução do escopo de FinOps para gestão DevOps operacional com segurança por ambiente.

- Em 2026-02-20, o projeto legado awsfin foi consolidado neste projeto (consoleai).
