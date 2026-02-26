---
id: kanbania-dashboard
parent: kanbania
name: "Kanbania — Dashboard Web"
description: "Frontend Next.js do sistema kanban: board, sprints, projetos, OKRs e pagina de Help"
repo: "/home/carlosfarah/kanbania"
tech_stack: [nextjs, typescript, tailwindcss, shadcn-ui]
status: active
created_at: "2026-02-23T19:00:00-03:00"
created_by: "claude-code"
---

## Escopo

### Incluido
- Paginas do dashboard em `dashboard/src/app/`
- Componentes em `dashboard/src/components/`
- APIs internas em `dashboard/src/app/api/`
- Build e deploy standalone

### Excluido
- Protocolo do kanban (AGENTS.md, scripts) — escopo de `kanbania-protocol`
- Infraestrutura systemd — escopo de `kanbania-infra`

## Setup

```bash
cd /home/carlosfarah/kanbania/dashboard
npm install
npm run dev
```

## Links

- App dir: `dashboard/src/app/`
- Docs de operacao: `docs/DASHBOARD_OPS.md`
