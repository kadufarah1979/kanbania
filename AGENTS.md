# AGENTS.md — Protocolo do Sistema Kanban

> Este arquivo define as regras canonicas de operacao do kanban.
> Se houver conflito com `CODEX.md` ou `CLAUDE.md`, este arquivo prevalece.
> Dados de configuracao (agentes, prioridades, story points, colunas, sprint, OKR) estao em `config.yaml`.

---

## 1. Visao Geral

Sistema de gerenciamento de projetos pessoais do proprietario `kadufarah` usando Markdown + YAML frontmatter.

Principios: Arquivo = entidade | Pasta = status | Git = historico | YAML = metadados | JSONL = log append-only.

Estrutura global: `board/{backlog,todo,in-progress,review,done}/`, `archive/`, `sprints/`, `okrs/`, `projects/`, `templates/`, `logs/activity.jsonl`.

Estrutura por subprojeto: `projects/<proj>/subprojects/<sub>/{board,sprints,okrs}/` — mesmas colunas, namespace isolado. Ver secao 3.2.

### 1.1 Papeis dos Agentes

| Agente | Papel | Colunas de atuacao | Transicoes permitidas |
|---|---|---|---|
| `claude-code` | Implementador | backlog, todo, in-progress, done (auto-approve) | `backlog -> todo`, `todo -> in-progress`, `in-progress -> review`, `in-progress -> done` (auto-approve, secao 4.4a) |
| `codex` | Revisor (QA) | review | `review -> done` (aprovado), `review -> in-progress` (reprovado) |

**Regras absolutas:**
- `claude-code` move para `done` apenas tasks auto-approve (secao 4.4a). Tasks com codex review: destino final e `review`.
- `codex` NUNCA implementa. Apenas revisa, aprova ou reprova.
- Para tasks com codex review, somente `codex` move `review -> done` ou `review -> in-progress`.

---

## 2. Convencoes

### 2.1 IDs e Arquivos

| Entidade | ID | Arquivo |
|---|---|---|
| Tarefa | `TASK-NNNN` | `TASK-NNNN.md` |
| OKR | `OKR-YYYY-QN-NN` | `YYYY-QN.md` |
| Sprint | `sprint-NNN` | `sprint-NNN.md` |
| Projeto | `slug-kebab` | `projects/<slug>/README.md` |
| Subprojeto | `slug-kebab` | `projects/<proj>/subprojects/<sub>/README.md` |

### 2.2 Regra de Resposta sobre Tasks

Ao listar tasks para o proprietario: informar `project` e `subproject` (quando presente) em cada task. Se todas forem do mesmo projeto/subprojeto, declarar explicitamente. Nunca assumir projeto por contexto implicito.

---

## 3. Schema Canonico de Tarefa

Arquivo: `board/**/TASK-NNNN.md`. Referencia completa: `templates/task.md`.

Campos obrigatorios: `id`, `title`, `project`, `priority`, `created_at`, `created_by`, `acted_by`.

Campos opcionais: `subproject`, `sprint`, `okr`, `labels`, `story_points`, `assigned_to`, `review_requested_from`, `depends_on`, `blocks`.

Campos proibidos: `points`, `status` (status vem da pasta).

### 3.2 Resolucao de Caminho de Board

Toda operacao que acessa o board ou sprint de uma task DEVE usar estas funcoes:

**resolve_board(task)**
1. Se `task.subproject` presente → `projects/<task.project>/subprojects/<task.subproject>/board/`
2. Se `projects/<task.project>/board/` existir → `projects/<task.project>/board/`
3. Senao → `board/` (projetos simples, legado)

**resolve_sprint(task)**
1. Se `task.subproject` presente → `projects/<task.project>/subprojects/<task.subproject>/sprints/`
2. Se `projects/<task.project>/sprints/` existir → `projects/<task.project>/sprints/`
3. Senao → `sprints/` (global)

Toda secao deste documento que menciona `board/` ou `sprints/` implicitamente usa `resolve_board()` / `resolve_sprint()` quando opera sobre uma task especifica.

### 3.3 Template de README de Subprojeto

Arquivo: `projects/<proj>/subprojects/<sub>/README.md`

Campos obrigatorios: `id`, `parent`, `name`, `description`, `repo`, `status`, `created_at`, `created_by`.
Campos opcionais: `tech_stack`, `okrs`.

### 3.1 Regra de Decomposicao de Tasks

Ao criar tasks (durante planejamento de sprint ou sob demanda), o agente DEVE avaliar o tamanho e amplitude antes de incluir no board:

1. **Task >= `epic_threshold` SP (5)**: DEVE ser decomposta em sub-tasks antes de entrar na sprint. Nunca criar task >= 5 SP sem quebra.
2. **Task >= `max_single_task` SP (3) e que afete > 3 arquivos**: DEVE ser decomposta em sub-tasks.
3. **Task que altere > `max_files_per_task` arquivos (5)**: DEVE ser decomposta independente de SP.
4. **Analise de amplitude**: ao estimar SP, listar mentalmente os arquivos afetados. Se > 3 arquivos, considerar quebra. Se > 5 arquivos, quebra obrigatoria.

Sub-tasks devem:
- Referenciar `parent: TASK-NNNN` no frontmatter.
- Usar `depends_on`/`blocks` para expressar ordem de execucao.
- Ser independentemente deployaveis quando possivel.
- Somar os mesmos SP da task original (ou ajustar se a decomposicao revelar complexidade diferente).

---

## 4. Fluxo Canonico

### 4.1 Transicoes permitidas

`backlog -> todo -> in-progress -> review -> done`
Excecao: `review -> in-progress` (reprovada em QA pelo `codex`).

### 4.2 Selecao de trabalho

1. **Rework prioritario**: checar `logs/rework-pending.jsonl`. Se houver entradas com `status: pending`, retomar essas tasks primeiro (sao reprovacoes do codex). Ao iniciar o rework, atualizar a entrada para `status: started`.
2. Retomar tarefa em `resolve_board(contexto)/in-progress/` com `assigned_to` igual ao agente.
3. Se nao houver, escolher unassigned em `resolve_board(contexto)/todo/` por prioridade.
4. Se `todo/` vazio da sprint ativa, aplicar secao 4.8 (promocao de lote) antes de selecionar.
5. WIP limit: max 2 cards em `in-progress/` por agente.

### 4.3 Claim

1. Verificar tarefa unassigned e WIP < 2.
2. Definir `assigned_to`, mover para `in-progress/`, registrar `acted_by` e `activity.jsonl`.

### 4.3.1 Validacao Bloqueante de Projeto

Antes de claim/move/execucao: validar `project` + `subproject` no frontmatter contra o contexto do agente. Se qualquer campo diferir do contexto, abortar sem alterar board.

### 4.4 Conclusao de implementacao (claude-code)

Ao concluir a implementacao, determinar o nivel de review pela regra abaixo:

**Auto-approve** (claude-code faz self-review e move direto para done):
- Tasks de 1-2 SP
- Refactoring, docs, config, infra kanban
- Labels: `refactor`, `docs`, `config`, `chore`, `tooling`

**Codex review obrigatorio**:
- Tasks de 3+ SP
- Features novas, mudancas em logica de negocio, API, auth, dados
- Labels: `feature`, `security`, `api`, `database`
- Na duvida: enviar para codex

#### 4.4a Fluxo auto-approve

1. Marcar criterios de aceite atendidos como `[x]`.
2. Adicionar nota em `## Notas de Progresso`.
3. Rodar testes relevantes. Se falharem, corrigir antes de prosseguir.
4. Merge da branch `task/TASK-NNNN` na `main` + push.
5. Mover direto para `done/`, registrar `acted_by` (action: `auto-approved`) e `activity.jsonl`.
6. Deletar branch local e remota.
7. Verificar se sprint esta completa (secao 4.4.2).
8. Pegar proxima task (secao 4.2).

#### 4.4b Fluxo com codex review

1. Marcar criterios de aceite atendidos como `[x]`.
2. Adicionar nota em `## Notas de Progresso`.
3. Definir `assigned_to: codex` e `review_requested_from: [codex]`.
4. Mover para `review/`, registrar `acted_by` e `activity.jsonl`.
5. Commit das alteracoes de codigo na branch `task/TASK-NNNN` + push da branch.
6. Commit da movimentacao do card (board state) na branch `main` + push.
7. Pegar proxima task disponivel (secao 4.2) — nao esperar o codex.

> Codigo de implementacao NUNCA vai direto para `main` sem review (self ou codex).
> Sempre via branch `task/TASK-NNNN`.

### 4.4.1 Revisao de QA (codex)

> **WIP 1**: processar um unico card por vez. Completar todo o ciclo (review + decisao + commit + push) antes de pegar o proximo.

> **Isolamento por projeto**: NUNCA misturar cards de projetos/subprojetos diferentes na mesma sessao. Filtrar pelo campo `project` + `subproject` e processar apenas cards de **um unico projeto ou subprojeto** por vez.

> **Proibido**: processar multiplos cards em lote, acumular movimentacoes, ou fazer um unico commit para varios cards.

Para cada card em `review/` com `review_requested_from: [codex]`:

1. Selecionar **1 card** de um unico projeto/subprojeto (prioridade: maior prioridade, menor ID como desempate).
2. Localizar o repositorio: se card tem `subproject` → `projects/<proj>/subprojects/<sub>/README.md` campo `repo`; senao → `projects/<proj>/README.md` campo `repo`.
3. Avaliar criterios de aceite, codigo e testes **na branch `task/TASK-NNNN`** do repositorio do projeto.
4. **Aprovado**:
   a. Merge da branch `task/TASK-NNNN` na `main` do repo do projeto + push.
   b. Mover card para `done/`, registrar `acted_by` e `activity.jsonl`.
   c. Commit + push no repo kanbania (operacao atomica).
   d. Deletar branch local e remota (`git branch -d task/TASK-NNNN && git push origin --delete task/TASK-NNNN`).
   e. Verificar se sprint esta completa (secao 4.4.2).
5. **Reprovado**:
   a. Mover card para `in-progress/`, adicionar pendencias objetivas (`arquivo:linha`) em `## Notas de Progresso`, registrar `acted_by` e `activity.jsonl`.
   b. Commit + push no repo kanbania (operacao atomica). Branch permanece aberta para correcoes.
6. **Somente apos commit+push**: pegar o proximo card em `review/` e repetir desde o passo 1.

> **Gate de QA**: para tasks com codex review, somente `codex` move `review -> done` ou `review -> in-progress`.

### 4.4.2 Deteccao automatica de sprint completa

Apos qualquer task ser movida para `done/`, o agente DEVE verificar:

1. Listar todas as tasks da sprint ativa que pertencem ao mesmo projeto/subprojeto.
2. Se **todas** estao em `resolve_board(task)/done/` (nenhuma em backlog, todo, in-progress ou review):
   a. Executar procedimento de encerramento de sprint (secao 7.1).
   b. Se existir proxima sprint com `status: pending` para o mesmo projeto/subprojeto, ativa-la:
      - Atualizar `status` para `active` e `resolve_sprint(task)/current.md`.
      - Aplicar promocao de lote (secao 4.8) para popular `todo/`.
   c. Commit + push (operacao atomica).
   d. Iniciar trabalho na nova sprint (secao 4.2).
3. Se **nao** estao todas em done: continuar normalmente (pegar proxima task).

> Nenhuma etapa requer confirmacao do proprietario. O encerramento e ativacao sao automaticos.

### 4.4.3 Estrategia de branches

**Regra**: codigo de implementacao vai para branch isolada. Board state (movimentacao de cards) vai para `main`.

**Fluxo completo:**

1. **Claim** (`todo -> in-progress`): criar branch `task/TASK-NNNN` a partir de `main`. Board state (move do card) commitado em `main`.
2. **Implementacao**: todos os commits de codigo na branch `task/TASK-NNNN`. Push da branch para remote.
3. **Move para review**: board state (card em `review/`) commitado em `main` + push. Branch `task/TASK-NNNN` ja esta no remote para revisao.
4. **Aprovacao (codex)**: merge `task/TASK-NNNN` -> `main` + push. Board state (card em `done/`) commitado em `main`.
5. **Reprovacao (codex)**: branch permanece aberta. `claude-code` faz correcoes na branch e repete o fluxo.
6. **Cleanup**: apos merge, deletar branch local e remota (`git branch -d task/TASK-NNNN && git push origin --delete task/TASK-NNNN`).

**Excecoes** (commit direto em `main`):
- Alteracoes exclusivamente em arquivos do kanban (`board/`, `sprints/`, `okrs/`, `logs/`, `AGENTS.md`, `CLAUDE.md`, `config.yaml`).
- Correcoes de emergencia (hotfix) aprovadas pelo proprietario.

### 4.5 Concorrencia

1. Card em `in-progress/` tem dono unico (`assigned_to`).
2. Proibido editar/mover card de outro agente.
3. Se bloqueado por card de outro agente, criar nova tarefa com `depends_on`.
4. Mesmo TASK nao pode existir em mais de uma coluna.
5. Move e operacao atomica (mesmo commit).

### 4.5.1 Consistencia Transacional

1. **Pre-condicao de estado**: cada transicao deve validar que o card esta na coluna de origem antes de mover.
   Exemplo: `review -> in-progress` so executa se o card estiver em `board/review/` no momento da operacao.
2. **Idempotencia**: se o estado alvo ja estiver aplicado, a operacao deve encerrar sem nova mutacao.
3. **Conflito de corrida**: ao falhar pre-condicao, abortar sem alterar board e registrar evento em `activity.jsonl`.

### 4.6 Ciclo autonomo pos-implementacao (claude-code)

1. Rodar testes relevantes do projeto.
2. Adicionar comentario em `## Notas de Progresso` com resultado dos testes.
3. **Testes passaram**: seguir secao 4.4 (mover para `review/`). Se `todo/` vazio da sprint ativa, aplicar secao 4.8. Pegar proxima task (secao 4.2).
4. **Testes falharam**: remover `assigned_to`, mover task para `todo/`, commit + push. Pegar proxima task (secao 4.2).

Nenhuma etapa requer confirmacao do proprietario.

### 4.7 Contexto de projeto do agente

O contexto do agente e determinado pelo diretorio de trabalho onde foi iniciado: `project` e, quando aplicavel, `subproject`. Antes de claim ou execucao, comparar ambos os campos da task com o contexto atual. Se qualquer campo nao corresponder, ignorar a task.

### 4.8 Distribuicao por lote de prioridade

Na criacao da sprint, todos os cards entram em `resolve_board(contexto)/backlog/`.
A promocao para `todo/` ocorre por **lote**:

1. **Selecao do ancora**: card de maior prioridade em `resolve_board(contexto)/backlog/` da sprint
   (desempate: menor ID numerico).
2. **Coleta da cadeia**: todos os cards ligados por `depends_on` ou `blocks`
   ao ancora, recursivamente.
3. **Promocao**: mover ancora + cadeia para `resolve_board(contexto)/todo/`.

**Gatilho**: aplicar sempre que `todo/` nao tiver cards da sprint ativa
(ao criar sprint, ao concluir lote anterior, ou ao iniciar sessao).

**Ativacao de sprint**: ao ativar uma sprint (status: pending -> active), promover **todas** as tasks da sprint de `backlog/` para `todo/` de uma vez. A distribuicao por lote aplica-se apenas durante a execucao da sprint (quando todo/ esvazia antes de backlog/).

Dentro do lote em `todo/`, a ordem de execucao segue secao 4.2 (prioridade).

---

## 5. Log de Atividades

Arquivo: `logs/activity.jsonl` — append-only, 1 JSON por linha.

Formato: `{"timestamp":"ISO-8601","agent":"...","action":"...","entity_type":"task","entity_id":"TASK-NNNN","details":"...","project":"..."}`

Acoes validas: `create`, `update`, `move`, `claim`, `release`, `comment`, `complete`, `delete`.

**Leitura**: agentes devem ler apenas as ultimas 20 linhas (`tail -20`). Nunca ler o arquivo completo.

---

## 6. Commits do Kanban

Formato: `[KANBAN] <acao> <entidade-id>: <descricao curta>` + `Agent: <id>` no corpo.

1 commit por mudanca logica. Evitar micro-commits.

### 6.1 Sincronizacao Obrigatoria

- Operacao mutavel so termina apos `commit` + `push`.
- Antes de editar board, executar `scripts/kanban-sync-check.sh`.
- Se `push` falhar, parar e registrar pendencia em `activity.jsonl`.

### 6.2 Arquivos do Board sao Artefatos Normais

- Arquivos em `board/` (backlog, todo, in-progress, review, done) NUNCA sao "inesperados" ou "sujeira".
- Se `git status` mostrar arquivos untracked ou modified em `board/`, a acao correta e SEMPRE commitar e push.
- Nunca perguntar ao proprietario o que fazer com arquivos do board. Commitar diretamente.
- Se `kanban-sync-check.sh` falhar por arquivo nao commitado, a solucao e: `git add` + `git commit` + `git push`.

---

## 7. Done e Archive

Destino operacional diario: `board/done/`.

### 7.1 Encerramento de Sprint

Executado automaticamente pela secao 4.4.2 ou pela verificacao de consistencia ao iniciar sessao.

1. Identificar todos os cards em `resolve_board(sprint)/done/` pertencentes a sprint sendo encerrada.
2. Mover esses cards para `resolve_board(sprint)/archive/done/`.
3. Mover sprint de `resolve_sprint(sprint)/` para `resolve_sprint(sprint)/archive/`.
4. Registrar em `activity.jsonl` com `action: archive`.
5. Atualizar status da sprint para `completed`.
6. Commit unico: `[KANBAN] archive sprint-NNN: encerrar sprint`.

> **Obrigatorio**: nenhuma sprint pode ter `status: closed` com cards ainda em `done/`. Se detectado, arquivar imediatamente.

---

## 8. OKRs e Sprints

Propor somente quando: solicitado pelo proprietario, inicio de trimestre sem OKR, ou sprint expirada.

Regras de OKR e Sprint estao em `config.yaml`. OKR/sprint precisam de aprovacao do proprietario.

### 8.1 Politica de Worktree por Sprint

- Criar worktree dedicada (`/tmp/kanbania-sprint-NNN`) com branch dedicada por sprint.
- Encerrar sprint com procedimento 7.1, merge/push e remocao da worktree.

---

## 9. Projetos Externos

1. Resolver contexto da task:
   - Com `subproject`: ler `projects/<proj>/subprojects/<sub>/README.md`
   - Sem `subproject`: ler `projects/<proj>/README.md`
2. Executar implementacao no repositorio indicado pelo campo `repo` do README.
3. Registrar progresso no kanban.

### 9.1 Worktree por Projeto

- Cada projeto opera em worktree dedicada (proibido compartilhar).
- Commits kanban somente na worktree `kanbania`.
- Validar `pwd` e `git rev-parse --show-toplevel` antes de commit.

### 9.2 Publicacao

- Worktree deve ter upstream configurado.
- `git fetch`/`rebase` antes de alteracoes mutaveis.
- Proibido acumular commits sem push.

---

## 10. Regras de Ouro

1. Ler este arquivo antes de operar no kanban.
2. Atualizar `acted_by` e `activity.jsonl` em toda operacao.
3. Respeitar concorrencia (secao 4.5).
4. Nunca violar schema canonico.
5. Nunca alterar linhas antigas de `activity.jsonl`.
6. Usar identificador de agente valido.
7. Nao impor OKR/sprint sem aprovacao.
8. Avaliar criterios de aceite antes de mover para `review/`.
9. Executar `kanban-sync-check.sh` antes de operacoes mutaveis.
10. Finalizar operacao mutavel com `commit` + `push`.

---

## 11. Eficiencia Operacional

1. Descoberta progressiva: caminhos especificos antes de busca global.
2. Evitar comandos de alta verbosidade sem filtro.
3. Reutilizar contexto ja coletado.
4. Preferir 2-3 comandos pequenos e direcionados.
5. So abrir artefatos grandes quando essenciais.
6. Ler `activity.jsonl` com `tail -20`, nunca o arquivo completo.
