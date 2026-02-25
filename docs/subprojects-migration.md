# Migração: Suporte a Subprojetos

> Data: 2026-02-23
> Autor: claude-code
> Tag de rollback: `pre-subprojects-20260223`

---

## Objetivo

Adicionar suporte a subprojetos como entidades de primeira classe no Kanbania, permitindo que projetos grandes tenham áreas distintas com boards, sprints e OKRs independentes.

## Escopo da mudança

Quatro arquivos alterados. Zero arquivos criados. Zero comportamentos existentes removidos — apenas estendidos.

| Arquivo | Tipo | Natureza |
|---|---|---|
| `AGENTS.md` | protocolo | extensão de regras existentes |
| `config.yaml` | configuração | nova seção `subprojects` |
| `templates/task.md` | template | campo opcional `subproject` |
| `CLAUDE.md` | instrução | atualização de paths kanban |

---

## Rollback

Para desfazer **todas** as mudanças desta migração:

```bash
git revert HEAD~N..HEAD   # reverter commits desta migração
# ou, para rollback total:
git checkout pre-subprojects-20260223 -- AGENTS.md config.yaml templates/task.md CLAUDE.md
git commit -m "[KANBAN] rollback subprojects: reverter para pre-subprojects-20260223"
git push
```

Tag preservada permanentemente: `pre-subprojects-20260223` (aponta para `999de46`).

---

## O que muda em cada arquivo

### AGENTS.md

| Seção | Mudança |
|---|---|
| 1 — Visão Geral | estrutura inclui boards por subprojeto |
| 2.1 — IDs e Arquivos | nova entidade `Subprojeto` |
| 2.2 — Regra de Resposta | incluir `subproject` ao listar tasks |
| 3 — Schema | campo opcional `subproject` |
| **Nova seção 3.2** | função `resolve_board()` e `resolve_sprint()` — regra central de resolução de caminho |
| 4.2 — Seleção de trabalho | usa `resolve_board()` |
| 4.3.1 — Validação Bloqueante | valida `project` + `subproject` |
| 4.4.1 — QA codex | resolve path do board via `resolve_board()` |
| 4.4.2 — Sprint completa | usa `resolve_sprint()` |
| 4.7 — Contexto do agente | inclui `subproject` no contexto |
| 4.8 — Distribuição por lote | usa `resolve_board()` |
| 7.1 — Encerramento de Sprint | archive dentro do namespace do subprojeto |
| 9 — Projetos Externos | resolve README via subprojeto quando presente |

### config.yaml

Nova seção `subprojects` com estrutura de pastas e flag por projeto.

### templates/task.md

Campo `subproject: null` após `project`.

### CLAUDE.md

Paths kanban expandidos para incluir `projects/` como diretório de board.

---

## Estrutura de pastas introduzida

```
projects/
  <projeto>/
    README.md
    subprojects/
      <subprojeto>/
        README.md          # repo, stack, responsável
        board/
          backlog/
          todo/
          in-progress/
          review/
          done/
        sprints/
          current.md
        okrs/              # opcional
```

### Template de README do subprojeto

```yaml
---
id: <subprojeto-slug>
parent: <projeto-slug>
name: "Nome legível"
description: "Descrição do escopo"
repo: "/caminho/para/repo"
tech_stack: []
status: active
created_at: "YYYY-MM-DDTHH:MM:SS-03:00"
created_by: "<agent>"
---
```

---

## Compatibilidade com projetos simples

Projetos sem subprojetos continuam operando exatamente como antes. A função `resolve_board()` tem fallback para `board/` global. Nenhuma task existente precisa ser migrada.
