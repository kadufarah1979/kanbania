---
id: kanbania
name: "Kanbania"
description: "Sistema kanban em arquivos markdown com dashboard web"
repo: "/home/carlosfarah/kanbania"
tech_stack: [nextjs, typescript, markdown, yaml]
status: active
created_at: "2026-02-16T11:37:03-03:00"
created_by: "codex"
---

## Visao Geral

Kanban pessoal baseado em arquivos markdown/yaml, com dashboard web para visualizacao de board, sprint, projetos e atividade.

## Escopo

### Incluido
- Gestao de tarefas via arquivos em `board/`
- Visualizacao no frontend em `dashboard/`
- Logs append-only em `logs/activity.jsonl`

### Excluido
- Persistencia em banco relacional
- Integracoes externas obrigatorias

## Arquitetura

Monorepo simples com raiz do kanban e app Next.js em `dashboard/`. A fonte de verdade e o filesystem.

## Setup do Ambiente

```bash
cd /home/carlosfarah/kanbania/dashboard
npm install
npm run dev
```

## Links e Referencias

- Repositorio: `/home/carlosfarah/kanbania`

## OKRs Vinculados

- A definir

## Notas

Projeto criado para consolidar manutencao do dashboard do kanban no proprio sistema.
