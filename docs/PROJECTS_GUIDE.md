# Guia de Criacao de Projetos e Subprojetos

> Referencia pratica para criacao de projetos e subprojetos no Kanbania.
> Regras canonicas de operacao estao em `AGENTS.md` — este guia nao as repete, apenas
> organiza os passos e templates necessarios para criacao.

---

## Conceitos

**Projeto** — unidade principal de trabalho. Tem um repositorio, tech stack e README em
`projects/<slug>/README.md`. Tasks de projetos simples usam o board global `board/`.

**Subprojeto** — area independente dentro de um projeto grande. Tem board, sprints e OKRs
proprios em `projects/<proj>/subprojects/<sub>/`. Use quando o projeto tem frentes com
tecnologias, cadencias ou times distintos.

**Quando usar subprojeto:**
- O projeto tem areas que nao compartilham dependencias entre si
- Cada area precisa de sprint e capacidade proprias
- O backlog do projeto esta grande demais para um unico board

---

## Criar um Projeto

### 1. Arquivo README

Criar `projects/<slug>/README.md`:

```yaml
---
id: <slug-kebab>
name: "<Nome legivel>"
description: "<O que o projeto entrega>"
repo: "<caminho absoluto do repositorio>"
tech_stack: [<lista>]
status: active
created_at: "<YYYY-MM-DDTHH:MM:SS-03:00>"
created_by: "<agent-id>"
---

## Visao Geral

<Descricao do projeto.>

## Escopo

### Incluido
- <item>

### Excluido
- <item>

## Setup do Ambiente

```bash
<comandos de setup>
```
```

### 2. Registrar no config.yaml

Se o projeto usara subprojetos, adicionar o slug em `config.yaml`:

```yaml
subprojects:
  projects_with_subprojects:
    - <slug>
```

### 3. Commit

```
[KANBAN] create project <slug>: <nome do projeto>
```

---

## Criar um Subprojeto

### 1. Estrutura de pastas

```
projects/<projeto>/subprojects/<subprojeto>/
├── README.md
├── board/
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── review/
│   └── done/
└── sprints/
    └── current.md
```

### 2. Arquivo README

Criar `projects/<projeto>/subprojects/<subprojeto>/README.md`:

```yaml
---
id: <subprojeto-slug>
parent: <projeto-slug>
name: "<Nome legivel>"
description: "<Escopo do subprojeto>"
repo: "<caminho absoluto do repositorio>"
tech_stack: [<lista>]
status: active
created_at: "<YYYY-MM-DDTHH:MM:SS-03:00>"
created_by: "<agent-id>"
---

## Escopo

### Incluido
- <item>

### Excluido
- <item>

## Setup

```bash
<comandos de setup>
```
```

### 3. Sprint inicial

Criar `projects/<projeto>/subprojects/<subprojeto>/sprints/sprint-001.md`:

```yaml
---
id: sprint-001
title: "<Titulo da sprint>"
goal: "<Objetivo em uma frase>"
project: <projeto-slug>
subproject: <subprojeto-slug>
start_date: "<YYYY-MM-DD>"
end_date: "<YYYY-MM-DD>"
status: active
capacity: <story-points>
created_by: "<agent-id>"
acted_by:
  - agent: "<agent-id>"
    action: created
    date: "<YYYY-MM-DDTHH:MM:SS-03:00>"
---

## Objetivo do Sprint

<Descricao do objetivo.>

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade |
|----|--------|--------|------------|
| TASK-NNNN | <titulo> | <SP> | <prioridade> |
```

Criar `projects/<projeto>/subprojects/<subprojeto>/sprints/current.md`:

```markdown
# Sprint Atual — <subprojeto>

**Sprint ativa**: sprint-001
Veja: [sprint-001](sprint-001.md)
```

### 4. Tasks iniciais

Cada task vai em `projects/<projeto>/subprojects/<subprojeto>/board/todo/TASK-NNNN.md`.
Usar o template em `templates/task.md` com os campos obrigatorios mais `subproject`:

```yaml
---
id: TASK-NNNN
title: "<Titulo imperativo>"
project: <projeto-slug>
subproject: <subprojeto-slug>
sprint: sprint-001
priority: <critical|high|medium|low>
labels: []
story_points: <1|2|3>
created_at: "<YYYY-MM-DDTHH:MM:SS-03:00>"
created_by: "<agent-id>"
assigned_to: null
review_requested_from: []
depends_on: []
blocks: []
acted_by:
  - agent: "<agent-id>"
    action: created
    date: "<YYYY-MM-DDTHH:MM:SS-03:00>"
---
```

> Regras de decomposicao de tasks: ver AGENTS.md secao 3.1.
> IDs de task sao sequenciais globais — verificar o maior ID existente antes de criar.

### 5. Registrar projeto no config.yaml

Adicionar o slug do projeto pai em `config.yaml → subprojects.projects_with_subprojects`
(se ainda nao estiver listado).

### 6. Commit

```
[KANBAN] create subproject <subprojeto>: <nome>
```

---

## Como os agentes resolvem o board

Os agentes usam `resolve_board(task)` e `resolve_sprint(task)` (AGENTS.md secao 3.2)
para encontrar o board correto de uma task:

| Situacao | Board usado |
|---|---|
| Task tem `subproject` | `projects/<proj>/subprojects/<sub>/board/` |
| Projeto tem board proprio | `projects/<proj>/board/` |
| Projeto simples | `board/` (global) |

---

## Checklist rapido

### Novo projeto simples
- [ ] `projects/<slug>/README.md` criado
- [ ] Commit `[KANBAN] create project <slug>`

### Novo subprojeto
- [ ] Pastas `board/{backlog,todo,in-progress,review,done}/` e `sprints/` criadas
- [ ] `README.md` com `id`, `parent`, `name`, `repo`, `status`
- [ ] `sprints/sprint-001.md` + `sprints/current.md`
- [ ] Tasks em `board/todo/` com campo `subproject` preenchido
- [ ] `config.yaml → subprojects.projects_with_subprojects` atualizado
- [ ] Commit `[KANBAN] create subproject <sub>`

---

## Exemplo de prompt para solicitar criacao

```
Cria o subprojeto `<slug>` dentro do projeto `<projeto>`.

- Nome: <Nome legivel>
- Descricao: <escopo em uma frase>
- Repo: <caminho>
- Tech stack: [lista]
- Sprint inicial: "<titulo>" — <objetivo>
- Tasks iniciais:
  - <titulo> (<SP> SP, <prioridade>)
  - <titulo> (<SP> SP, <prioridade>)
```
