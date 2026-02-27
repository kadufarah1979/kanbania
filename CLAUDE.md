# CLAUDE.md — Instrucoes do agente claude-code

> Complementa `AGENTS.md` (que prevalece em caso de conflito).

- Identificador: `claude-code`
- Ao iniciar: ler `resolve_sprint(contexto)/current.md` (AGENTS.md secao 3.2), verificar consistencia (AGENTS.md secao 7.1), checar `logs/rework-pending.jsonl` para rework prioritario (AGENTS.md secao 4.2), retomar task em `in-progress/` ou buscar em `todo/`/`backlog/` via `resolve_board(contexto)`.
- Commits: `[KANBAN] <acao> <TASK-ID>: <descricao>` com `Agent: claude-code`.

## Idioma e comunicacao

- Toda comunicacao com o proprietário em português (pt-BR) com acentuação correta.
- Commits, frontmatter e logs em português sem acentos (limitação de ferramentas que não suportam UTF-8).
- Nao pedir confirmacao para operacoes kanban rotineiras (claim, move, commit+push).
- Nao perguntar "deseja que eu faca commit?" — se a tarefa esta concluida, fazer commit+push diretamente.

## Decisoes tecnicas

- Stack do dashboard: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- Sempre usar imports absolutos com `@/` no dashboard.
- Testes: rodar apenas os testes relevantes, nunca a suite inteira.
- Preferir editar arquivos existentes. Nunca criar READMEs ou docs sem pedido explicito.
- Nao adicionar comentarios, docstrings ou type annotations em codigo que nao foi alterado.
- Apos qualquer build do dashboard: ver `docs/DASHBOARD_OPS.md` para reiniciar corretamente (standalone, nao `next start`).
- Comando correto de restart (executar a partir de `dashboard/`):
  ```bash
  cd /home/carlosfarah/kanbania-fresh/dashboard
  sudo fuser -k 8765/tcp 2>/dev/null || true
  cp -r .next/static .next/standalone/.next/static
  cp -r public .next/standalone/public 2>/dev/null || true
  KANBAN_ROOT=/home/carlosfarah/kanbania-fresh PORT=8765 \
    nohup node .next/standalone/server.js > /tmp/kanbania-next.log 2>&1 &
  ```
- Nunca subir o servidor sem `PORT=8765` — sem isso ele tenta porta 3000 e falha silenciosamente.

## Workflow

- Ao receber uma tarefa, executar sem pedir confirmacao de abordagem — a menos que haja ambiguidade real.
- Nao listar o que vai fazer antes de fazer. Fazer direto.
- Ao terminar implementacao: seguir AGENTS.md secao 4.4 (auto-approve ou codex review) e secao 4.6 (ciclo autonomo). Sem perguntar.
- Se precisar rodar build/lint/test, rodar direto sem pedir permissao.
- Codigo de implementacao: SEMPRE na branch `task/TASK-NNNN` (AGENTS.md secao 4.4.3). Board state em `main`.
- Ao mover task para `review/`: OBRIGATORIO definir `review_requested_from: [codex]` no frontmatter. Sem isso o Codex nao detecta a task e o review nao acontece.
- Isso vale para TODOS os projetos, inclusive kanbania. Se a task altera `dashboard/`, `scripts/`, `server.ts` ou qualquer arquivo de codigo, criar branch. Somente arquivos kanban puros (`board/`, `projects/*/subprojects/*/board/`, `sprints/`, `projects/*/subprojects/*/sprints/`, `logs/`, `AGENTS.md`) vao direto em main.
- Ao criar branch para kanbania: `git branch task/TASK-NNNN` a partir de main, fazer commits de codigo na branch, e push.

## Fluxo continuo

- Ao concluir uma task: verificar `resolve_board(contexto)/todo/` da sprint ativa e fazer claim da proxima (AGENTS.md secao 4.2). Sem perguntar.
- Se `todo/` esvaziar: aplicar promocao de lote (AGENTS.md secao 4.8).
- Se nao houver mais tasks na sprint: executar encerramento automatico (AGENTS.md secao 4.4.2).
- O agente so para quando nao ha mais tasks ou o proprietario intervem.
