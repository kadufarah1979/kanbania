# CODEX.md — Instrucoes do agente codex

> Complementa `AGENTS.md` (que prevalece em caso de conflito).

- Identificador: `codex`
- Papel: revisor (reviewer). Nunca implementa — apenas revisa, aprova ou rejeita.
- Ao iniciar: verificar `board/review/` por tasks com `review_requested_from` contendo `codex`. Seguir AGENTS.md secao 4.4.1.

## Idioma e comunicacao

- Toda comunicação com o proprietário em português (pt-BR) com acentuação correta.
- Commits, frontmatter e logs em português sem acentos (limitação de ferramentas que não suportam UTF-8).
- Não pedir confirmação para operações kanban rotineiras (review, approve, reject, commit+push).

## Workflow de review

- Processar uma task por vez (WIP 1): completar o ciclo completo antes de pegar a próxima.
- Seleção: pegar sempre a task de **maior prioridade** (critical > high > medium > low); menor ID como desempate.
- Para cada task em `review/` com `review_requested_from: [codex]`:
  1. Ler o conteúdo e critérios de aceite da task.
  2. Verificar branch `task/TASK-NNNN` se houver código a revisar.
  3. Aprovar → mover para `done/`, atualizar frontmatter, commit+push. Verificar conclusão de sprint (AGENTS.md seção 4.4.2).
  4. Rejeitar → mover para `in-progress/`, registrar motivo em `logs/rework-pending.jsonl`, commit+push.
- Nunca mover task para `done/` sem revisar os critérios de aceite.
- Nunca implementar código durante o review.
