# Kanbania — Quickstart

Get up and running in under 5 minutes.

---

## Prerequisites

| Dependency | Version | Install |
|---|---|---|
| bash | 4.4+ | pre-installed on Linux/macOS |
| git | 2.20+ | pre-installed |
| [yq](https://github.com/mikefarah/yq) | 4.x | `snap install yq` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) — dashboard only |

Install `yq`:
```bash
wget -qO ~/.local/bin/yq \
  https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
chmod +x ~/.local/bin/yq
```

---

## Step 1 — Clone and initialize

```bash
git clone https://github.com/kanbania/kanbania.git my-kanban
cd my-kanban
./setup.sh --quick
```

`--quick` accepts all defaults (rename system, add agents later). For a guided setup:

```bash
./setup.sh --detailed    # configure agents, columns, notifications interactively
```

This creates:
- `config.yaml` — system-wide configuration
- `config.local.yaml` — machine-specific paths (gitignored)
- `board/{backlog,todo,in-progress,review,done}/`

---

## Step 2 — Configure your agents

Edit `config.yaml` to reflect who (or what) works on this board:

```yaml
agents:
  - id: "alice"
    name: "Alice"
    provider: "human"
    role: "both"          # implementer | reviewer | both | pm
    color: "#f59e0b"
    exec_command: null
    wip_limit: 5

  - id: "claude-code"
    name: "Claude Code"
    provider: "anthropic"
    role: "implementer"
    color: "#a855f7"
    exec_command: null    # set to your invocation command for auto-trigger
    wip_limit: 2
```

Copy an agent instruction template to your agent's config file:

```bash
cp templates/agents/en/implementer.md CLAUDE.md   # edit {AGENT_ID}, {KANBAN_ROOT} etc.
cp templates/agents/en/reviewer.md    CODEX.md
```

Set your agent identity for the CLI:

```bash
export KB_AGENT=alice
```

---

## Step 3 — Create your first task

Tasks are plain Markdown files with YAML frontmatter. Drop one in `board/todo/`:

```bash
cat > board/todo/TASK-0001.md << 'EOF'
---
id: TASK-0001
version: 1
title: "My first task"
project: my-project
subproject: null
sprint: null
okr: null
priority: medium
labels: [feature]
story_points: 2
created_at: "2026-01-01T10:00:00Z"
created_by: "alice"
assigned_to: null
review_requested_from: []
depends_on: []
blocks: []
acted_by: []
---

## Description

What needs to be done.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
EOF
```

---

## Step 4 — Use the CLI

```bash
# Check board state
bash scripts/kb.sh status

# Claim a task (moves todo → in-progress)
bash scripts/kb.sh claim TASK-0001

# Submit for review (moves in-progress → review)
bash scripts/kb.sh review TASK-0001

# Approve (annotates in review)
bash scripts/kb.sh approve TASK-0001

# All commands support --dry-run
bash scripts/kb.sh --dry-run claim TASK-0001
```

Every transition commits to Git automatically.

---

## Step 5 — Project boards (optional)

If you have multiple projects with separate backlogs:

```bash
# Create an isolated board for a project
./setup.sh --add-project my-app

# Create an isolated board for a subproject
./setup.sh --add-subproject my-app backend
```

Tasks with matching `project:` (and `subproject:`) in their frontmatter are automatically routed to the correct board. The global `board/` always works as a fallback.

```
projects/
└── my-app/
    ├── board/              ← project-level board
    └── subprojects/
        └── backend/
            └── board/      ← subproject-level board
```

---

## Step 6 — Dashboard (optional)

```bash
cd dashboard
npm install
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

KANBAN_ROOT=/absolute/path/to/my-kanban PORT=8765 \
  nohup node .next/standalone/server.js > /tmp/kanbania-next.log 2>&1 &
```

Open `http://localhost:8765`.

> **Important:** always use `node .next/standalone/server.js` — not `next start`.
> Always copy `.next/static` to `.next/standalone/.next/static` after every build.

---

## Common patterns

### Sprint workflow

```bash
# 1. Create a sprint file in sprints/
# 2. Set sprint: sprint-001 in task frontmatter
# 3. When done, close the sprint
bash scripts/kb.sh complete-sprint sprint-001
```

### Batch review

```bash
bash scripts/kb.sh --confirm batch-review TASK-0001 TASK-0002 TASK-0003
```

### Source the config library in your own scripts

```bash
source scripts/lib/config.sh

cfg '.system.name'           # → "My Kanban"
get_columns                  # → backlog todo in-progress review done
get_reviewers                # → agents with role reviewer or both
resolve_board TASK-0001.md   # → /path/to/correct/board/
get_board_dirs               # → all board dirs (global + projects + subprojects)
```

---

## Upgrade from an older version

```bash
./setup.sh --upgrade         # adds missing config.yaml keys non-destructively
./setup.sh --from-config     # recreates board/ directories from existing config
```

---

## Further reading

- [AGENTS.md](AGENTS.md) — full board workflow, task schema, agent roles, sprint lifecycle
- [docs/DASHBOARD_OPS.md](docs/DASHBOARD_OPS.md) — dashboard restart and troubleshooting
- [docs/PROJECTS_GUIDE.md](docs/PROJECTS_GUIDE.md) — multi-project setup
- [config.yaml](config.yaml) — annotated configuration reference
