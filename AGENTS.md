# AGENTS.md — Kanban System Protocol

> Canonical rules. Overrides agent-specific files (CLAUDE.md, CODEX.md). Config in `config.yaml`.

---

## 1. Structure & Roles

**Layout:** `board/{backlog,todo,in-progress,review,done}/` | `archive/` | `sprints/` | `okrs/` | `projects/` | `logs/activity.jsonl`
**Subproject:** `projects/<proj>/subprojects/<sub>/{board,sprints,okrs}/`

| Role | Actions | Transitions |
|---|---|---|
| `implementer` | Claim, implement, submit | backlog→todo→in-progress→review (or done via auto-approve) |
| `reviewer` | QA, approve, reject | review→done or review→in-progress |
| `both` | All above | all |
| `pm` | Planning | all (read) |

Reviewer NEVER implements. Implementer moves to `done` only on auto-approve. Only reviewer moves `review→done/in-progress`.

---

## 2. Task Schema

Required: `id`, `title`, `project`, `priority`, `created_at`, `created_by`, `acted_by`.
Optional: `subproject`, `sprint`, `okr`, `labels`, `story_points`, `assigned_to`, `review_requested_from`, `depends_on`, `blocks`.
Forbidden: `points`, `status`.

**IDs:** `TASK-NNNN` | `OKR-YYYY-QN-NN` | `sprint-NNN` | project slug = kebab-case

**Decomposition:** >= 5 SP → must split. >= 3 SP affecting > 3 files → must split. > 5 files → always split.
Sub-tasks: `parent: TASK-NNNN`, `depends_on`/`blocks` for order, independently deployable.

**Board path resolution (use on every operation):**
- `subproject` present → `projects/<proj>/subprojects/<sub>/board/`
- else if `projects/<proj>/board/` exists → use it
- else → `board/`

**Sprint path:** same logic with `sprints/`.

**When listing tasks for owner:** always include `project` and `subproject`.

---

## 3. Canonical Flow

**Transitions:** `backlog→todo→in-progress→review→done` | Exception: `review→in-progress` (rejected)

### 3.1 Work Selection
1. Check `logs/rework-pending.jsonl` for `status: pending` entries — resume those first, set to `started`.
2. Resume own card in `in-progress/`.
3. Pick highest-priority unassigned from `todo/`.
4. If `todo/` empty → apply batch promotion (3.6) first.
5. WIP limit: 2 cards per agent.

### 3.2 Claim
Set `assigned_to`, move to `in-progress/`, record `acted_by` + `activity.jsonl`.

### 3.3 Auto-approve (implementer → done directly)
Applies to: 1-2 SP | labels `refactor`, `docs`, `config`, `chore`, `tooling`.
1. Mark acceptance criteria `[x]`, add progress note, run relevant tests.
2. Merge `task/TASK-NNNN` → `main` + push. Move to `done/`. Record `acted_by` + `activity.jsonl`. Delete branch.
3. Check sprint completion (3.5). Pick next task.

### 3.4 Reviewer flow (3+ SP / feature / security / api / database / doubt)
1. Mark criteria `[x]`, add progress note, set `assigned_to` + `review_requested_from: [<reviewer>]`.
2. Move to `review/`, record `acted_by` + `activity.jsonl`.
3. Commit code on `task/TASK-NNNN` + push branch. Commit board state to `main` + push.
4. Pick next task immediately — do not wait.

### 3.4.1 QA Review (reviewer role)
**WIP 1.** One card at a time. Full cycle (review + decision + commit + push) before next. No batch commits.
**Project isolation:** only cards from a single project/subproject per session.

For each card with `review_requested_from` containing own agent ID:
1. Pick highest priority, lowest ID. Locate repo via README `repo` field.
2. Evaluate criteria, code, tests on `task/TASK-NNNN` branch.
3. **Approved:** merge branch → `main` + push project repo. Move card to `done/`, commit + push kanban. Delete branch. Check sprint (3.5).
4. **Rejected:** move card to `in-progress/`, add pending items (`file:line`) in Progress Notes. Commit + push kanban. Branch stays open.

### 3.5 Sprint Auto-completion
After any task → `done/`: list all sprint tasks for same project/subproject. If all in `done/`:
1. Archive sprint (3.7). If pending sprint exists → activate it, promote tasks (3.6), pick next.

### 3.6 Batch Promotion (todo/ empty during execution)
1. Pick highest-priority anchor from `backlog/` (tiebreaker: lowest ID).
2. Collect full dependency chain (`depends_on`/`blocks`).
3. Move anchor + chain to `todo/`.
**Sprint activation:** promote ALL sprint tasks from `backlog/` → `todo/` at once.

### 3.7 Branch Strategy
- Code → `task/TASK-NNNN` branch. Board state (card moves) → `main`.
- Exception: kanban-only changes (`board/`, `sprints/`, `okrs/`, `logs/`, `AGENTS.md`, `config.yaml`) → commit directly to `main`.

### 3.8 Concurrency
One owner per card. Never touch another agent's card. Same task cannot exist in > 1 column. Move = atomic commit.

---

## 4. Activity Log

File: `logs/activity.jsonl` — append-only, 1 JSON/line.
Format: `{"timestamp":"ISO-8601","agent":"...","action":"...","entity_type":"task","entity_id":"TASK-NNNN","details":"...","project":"..."}`
Valid actions: `create`, `update`, `move`, `claim`, `release`, `comment`, `complete`, `delete`.
**Read only last 20 lines (`tail -20`). Never read full file.**

---

## 5. Commits & Sync

Format: `[KANBAN] <action> <entity-id>: <description>` + `Agent: <id>` in body. 1 commit per logical change.

- Run `scripts/kanban-sync-check.sh` before mutable ops.
- Op completes only after `commit` + `push`.
- Board files in `git status` → always commit. Never ask owner.

---

## 6. Archive

`board/done/` → daily destination. Sprint close (auto via 3.5):
1. Move sprint's `done/` cards → `archive/done/`.
2. Move sprint file → `archive/sprints/`. Set `status: completed`. Log `action: archive`.
3. Single commit: `[KANBAN] archive sprint-NNN: close sprint`.

---

## 7. External Projects

Resolve repo from `projects/<proj>/README.md` or `.../subprojects/<sub>/README.md` (`repo` field).
Each project uses a dedicated worktree. Kanban commits only in kanban worktree.
`git fetch`/`rebase` before mutable ops. No accumulating commits without push.

---

## 8. Golden Rules

1. `acted_by` + `activity.jsonl` on every operation.
2. `kanban-sync-check.sh` before mutable ops. Finalize with `commit` + `push`.
3. Never violate schema. Never alter old `activity.jsonl` lines.
4. Agent ID must be valid (from `config.yaml`).
5. OKR/sprint require owner approval.
6. Evaluate acceptance criteria before `review/`.
7. Progressive discovery: targeted commands first. `tail -20` for logs.

---

## 9. PDF Reports

Template: `/home/carlosfarah/Projects/IaC/Innovaq/docs/templates/pdf_report.py` — call `generate_pdf()`.
Apply `apply_accents()`. Save to `projects/<slug>/docs/` by default. Details: load template file on demand.
