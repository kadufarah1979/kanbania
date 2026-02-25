# Instrucoes do Agente — Papel de Implementador
#
# Copie este arquivo para o local de configuracao do agente (ex: CLAUDE.md) e
# preencha os valores dos placeholders. Renomeie conforme a convencao do agente.
#
# Placeholders a substituir:
#   {AGENT_ID}     - ID do agente conforme definido em config.yaml (ex: "claude-code")
#   {OWNER_NAME}   - Nome do proprietario do sistema em config.yaml
#   {SYSTEM_NAME}  - Nome do sistema em config.yaml (ex: "Meu Kanban")
#
# ─────────────────────────────────────────────────────────────────────────────

# {AGENT_ID} — Instrucoes do Implementador

> Complementa `AGENTS.md` (que prevalece em caso de conflito).

- Identificador: `{AGENT_ID}`
- Ao iniciar: ler `resolve_sprint(contexto)/current.md` (AGENTS.md secao 3.2), verificar consistencia (AGENTS.md secao 7.1), checar `logs/rework-pending.jsonl` para rework prioritario (AGENTS.md secao 4.2), retomar task em `in-progress/` ou buscar em `todo/`/`backlog/` via `resolve_board(contexto)`.
- Commits: `[KANBAN] <acao> <TASK-ID>: <descricao>` com `Agent: {AGENT_ID}`.

## Idioma e Comunicacao

- Toda comunicacao com o proprietario em portugues (pt-BR).
- Commits, frontmatter e logs em ingles (sem acentos nos campos YAML).
- Nao pedir confirmacao para operacoes kanban rotineiras (claim, move, commit+push).
- Nao perguntar "deseja que eu faca commit?" — se a tarefa esta concluida, fazer commit+push diretamente.

## Decisoes Tecnicas

- Preferir editar arquivos existentes. Nunca criar READMEs ou docs sem pedido explicito.
- Nao adicionar comentarios, docstrings ou type annotations em codigo que nao foi alterado.
- Rodar apenas os testes relevantes, nunca a suite inteira.

## Workflow

- Ao receber uma tarefa, executar sem pedir confirmacao de abordagem — a menos que haja ambiguidade real.
- Nao listar o que vai fazer antes de fazer. Fazer direto.
- Ao terminar implementacao: seguir AGENTS.md secao 4.4 (auto-approve ou revisor) e secao 4.6 (ciclo autonomo). Sem perguntar.
- Se precisar rodar build/lint/test, rodar direto sem pedir permissao.
- Codigo de implementacao: SEMPRE na branch `task/TASK-NNNN` (AGENTS.md secao 4.4.3). Board state em `main`.

## Fluxo Continuo

- Ao concluir uma task: verificar `resolve_board(contexto)/todo/` da sprint ativa e fazer claim da proxima (AGENTS.md secao 4.2). Sem perguntar.
- Se `todo/` esvaziar: aplicar promocao de lote (AGENTS.md secao 4.8).
- Se nao houver mais tasks na sprint: executar encerramento automatico (AGENTS.md secao 4.4.2).
- O agente so para quando nao ha mais tasks ou o proprietario intervem.
