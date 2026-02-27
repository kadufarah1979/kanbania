# AGENTS.md — Kanban System Protocol

> This file defines the canonical operating rules for the kanban system.
> In case of conflict with agent-specific files (e.g. CLAUDE.md, CODEX.md), this file prevails.
> Configuration (agent IDs, priorities, story points, columns, sprint, OKR) is in `config.yaml`.

---

## 1. Overview

A personal project management system using Markdown + YAML frontmatter.

Principles: File = entity | Folder = status | Git = history | YAML = metadata | JSONL = append-only log.

Global structure: `board/{backlog,todo,in-progress,review,done}/`, `archive/`, `sprints/`, `okrs/`, `projects/`, `templates/`, `logs/activity.jsonl`.

Subproject structure: `projects/<proj>/subprojects/<sub>/{board,sprints,okrs}/` — same columns, isolated namespace. See section 3.2.

### 1.1 Agent Roles

Agent roles are defined in `config.yaml` under `agents[].role`. Valid roles:

| Role | Can do | Board columns |
|---|---|---|
| `implementer` | Claim, implement, submit for review | backlog → todo → in-progress → review (or done via auto-approve) |
| `reviewer` | QA review, approve, reject | review → done (approved), review → in-progress (rejected) |
| `both` | All of the above | all columns |
| `pm` | Planning, sprint management | all columns (read) |

**Absolute rules:**
- The implementer moves to `done` only for auto-approve tasks (section 4.4a). For reviewer tasks: the final destination is `review`.
- The reviewer NEVER implements. Only reviews, approves, or rejects.
- For reviewed tasks, only the reviewer moves `review → done` or `review → in-progress`.

Refer to `config.yaml` for the actual agent IDs assigned to each role.

---

## 2. Conventions

### 2.1 IDs and Files

| Entity | ID | File |
|---|---|---|
| Task | `TASK-NNNN` | `TASK-NNNN.md` |
| OKR | `OKR-YYYY-QN-NN` | `YYYY-QN.md` |
| Sprint | `sprint-NNN` | `sprint-NNN.md` |
| Project | `slug-kebab` | `projects/<slug>/README.md` |
| Subproject | `slug-kebab` | `projects/<proj>/subprojects/<sub>/README.md` |

### 2.2 Task Listing Rule

When listing tasks for the owner: always include `project` and `subproject` (when present) for each task. If all tasks belong to the same project/subproject, state it explicitly. Never assume project from implicit context.

---

## 3. Canonical Task Schema

File: `board/**/TASK-NNNN.md`. Full reference: `templates/task.md`.

Required fields: `id`, `title`, `project`, `priority`, `created_at`, `created_by`, `acted_by`.

Optional fields: `subproject`, `sprint`, `okr`, `labels`, `story_points`, `assigned_to`, `review_requested_from`, `depends_on`, `blocks`.

Forbidden fields: `points`, `status` (status is determined by folder location).

### 3.2 Board Path Resolution

Every operation accessing the board or sprint of a task MUST use these functions:

**resolve_board(task)**
1. If `task.subproject` is present → `projects/<task.project>/subprojects/<task.subproject>/board/`
2. If `projects/<task.project>/board/` exists → `projects/<task.project>/board/`
3. Otherwise → `board/` (simple projects, legacy)

**resolve_sprint(task)**
1. If `task.subproject` is present → `projects/<task.project>/subprojects/<task.subproject>/sprints/`
2. If `projects/<task.project>/sprints/` exists → `projects/<task.project>/sprints/`
3. Otherwise → `sprints/` (global)

Every section in this document that mentions `board/` or `sprints/` implicitly uses `resolve_board()` / `resolve_sprint()` when operating on a specific task.

### 3.3 Subproject README Template

File: `projects/<proj>/subprojects/<sub>/README.md`

Required fields: `id`, `parent`, `name`, `description`, `repo`, `status`, `created_at`, `created_by`.
Optional fields: `tech_stack`, `okrs`.

### 3.1 Task Decomposition Rule

When creating tasks (sprint planning or on-demand), the agent MUST evaluate size and scope before adding to the board:

1. **Task >= `epic_threshold` SP (5)**: MUST be decomposed into sub-tasks before entering the sprint. Never create a task >= 5 SP without breaking it down.
2. **Task >= `max_single_task` SP (3) that affects > 3 files**: MUST be decomposed.
3. **Task that changes > `max_files_per_task` files (5)**: MUST be decomposed regardless of SP.
4. **Scope analysis**: when estimating SP, mentally list affected files. If > 3 files, consider splitting. If > 5 files, splitting is mandatory.

Sub-tasks must:
- Reference `parent: TASK-NNNN` in frontmatter.
- Use `depends_on`/`blocks` to express execution order.
- Be independently deployable when possible.
- Sum the same SP as the original task (or adjust if decomposition reveals different complexity).

---

## 4. Canonical Flow

### 4.1 Allowed Transitions

`backlog → todo → in-progress → review → done`
Exception: `review → in-progress` (rejected in QA by the reviewer agent).

### 4.2 Work Selection

1. **Priority rework**: check `logs/rework-pending.jsonl`. If there are entries with `status: pending`, resume those tasks first (they are reviewer rejections). When starting rework, update the entry to `status: started`.
2. Resume task in `resolve_board(context)/in-progress/` with `assigned_to` equal to the current agent.
3. If none, pick unassigned from `resolve_board(context)/todo/` by priority.
4. If `todo/` is empty for the active sprint, apply section 4.8 (batch promotion) before selecting.
5. WIP limit: max 2 cards in `in-progress/` per agent.

### 4.3 Claim

1. Verify task is unassigned and WIP < 2.
2. Set `assigned_to`, move to `in-progress/`, record `acted_by` and `activity.jsonl`.

### 4.3.1 Blocking Project Validation

Before claim/move/execution: validate `project` + `subproject` in frontmatter against the current agent context. If either field differs from context, abort without modifying the board.

### 4.4 Implementation Completion (implementer role)

When implementation is complete, determine the review level using the rule below:

**Auto-approve** (implementer performs self-review and moves directly to done):
- Tasks of 1-2 SP
- Refactoring, docs, config, kanban infra
- Labels: `refactor`, `docs`, `config`, `chore`, `tooling`

**Reviewer review required**:
- Tasks of 3+ SP
- New features, business logic changes, API, auth, data
- Labels: `feature`, `security`, `api`, `database`
- When in doubt: send to reviewer

#### 4.4a Auto-approve flow

1. Mark acceptance criteria as met with `[x]`.
2. Add note in `## Progress Notes`.
3. Run relevant tests. If they fail, fix before proceeding.
4. Merge `task/TASK-NNNN` branch into `main` + push.
5. Move directly to `done/`, record `acted_by` (action: `auto-approved`) and `activity.jsonl`.
6. Delete local and remote branch.
7. Check if sprint is complete (section 4.4.2).
8. Pick next task (section 4.2).

#### 4.4b Flow with reviewer review

1. Mark acceptance criteria as met with `[x]`.
2. Add note in `## Progress Notes`.
3. Set `assigned_to: <reviewer-agent-id>` and `review_requested_from: [<reviewer-agent-id>]`.
4. Move to `review/`, record `acted_by` and `activity.jsonl`.
5. Commit code changes to `task/TASK-NNNN` branch + push branch.
6. Commit card movement (board state) to `main` branch + push.
7. Pick next available task (section 4.2) — do not wait for reviewer.

> Implementation code NEVER goes directly to `main` without review (self or reviewer).
> Always via `task/TASK-NNNN` branch.

### 4.4.1 QA Review (reviewer role)

> **WIP 1**: process a single card at a time. Complete the full cycle (review + decision + commit + push) before picking the next one.

> **Project isolation**: NEVER mix cards from different projects/subprojects in the same session. Filter by `project` + `subproject` fields and process only cards from **a single project or subproject** at a time.

> **Prohibited**: processing multiple cards in batch, accumulating movements, or making a single commit for multiple cards.

For each card in `review/` with `review_requested_from` containing this reviewer's agent ID:

1. Select **1 card** from a single project/subproject (priority: highest priority, lowest ID as tiebreaker).
2. Locate the repository: if card has `subproject` → `projects/<proj>/subprojects/<sub>/README.md` `repo` field; otherwise → `projects/<proj>/README.md` `repo` field.
3. Evaluate acceptance criteria, code, and tests **on the `task/TASK-NNNN` branch** of the project repository.
4. **Approved**:
   a. Merge `task/TASK-NNNN` into `main` of the project repo + push.
   b. Move card to `done/`, record `acted_by` and `activity.jsonl`.
   c. Commit + push in kanban repo (atomic operation).
   d. Delete local and remote branch (`git branch -d task/TASK-NNNN && git push origin --delete task/TASK-NNNN`).
   e. Check if sprint is complete (section 4.4.2).
5. **Rejected**:
   a. Move card to `in-progress/`, add objective pending items (`file:line`) in `## Progress Notes`, record `acted_by` and `activity.jsonl`.
   b. Commit + push in kanban repo (atomic operation). Branch remains open for corrections.
6. **Only after commit+push**: pick the next card in `review/` and repeat from step 1.

> **QA Gate**: for reviewed tasks, only the reviewer agent moves `review → done` or `review → in-progress`.

### 4.4.2 Automatic sprint completion detection

After any task is moved to `done/`, the agent MUST verify:

1. List all tasks of the active sprint belonging to the same project/subproject.
2. If **all** are in `resolve_board(task)/done/` (none in backlog, todo, in-progress, or review):
   a. Execute sprint closing procedure (section 7.1).
   b. If a next sprint with `status: pending` exists for the same project/subproject, activate it:
      - Update `status` to `active` and `resolve_sprint(task)/current.md`.
      - Apply batch promotion (section 4.8) to populate `todo/`.
   c. Commit + push (atomic operation).
   d. Start work in new sprint (section 4.2).
3. If **not** all in done: continue normally (pick next task).

> No step requires owner confirmation. Closing and activation are automatic.

### 4.4.3 Branch strategy

**Rule**: implementation code goes to an isolated branch. Board state (card movements) goes to `main`.

**Full flow:**

1. **Claim** (`todo → in-progress`): create `task/TASK-NNNN` branch from `main`. Board state (card move) committed to `main`.
2. **Implementation**: all code commits on `task/TASK-NNNN` branch. Push branch to remote.
3. **Move to review**: board state (card in `review/`) committed to `main` + push. `task/TASK-NNNN` branch is already on remote for review.
4. **Approval (reviewer)**: merge `task/TASK-NNNN` → `main` + push. Board state (card in `done/`) committed to `main`.
5. **Rejection (reviewer)**: branch stays open. Implementer makes corrections on branch and repeats the flow.
6. **Cleanup**: after merge, delete local and remote branch.

**Exceptions** (commit directly to `main`):
- Changes exclusively to kanban files (`board/`, `sprints/`, `okrs/`, `logs/`, `AGENTS.md`, agent config files, `config.yaml`).
- Emergency fixes (hotfix) approved by owner.

### 4.5 Concurrency

1. Card in `in-progress/` has a single owner (`assigned_to`).
2. Prohibited: editing/moving another agent's card.
3. If blocked by another agent's card, create a new task with `depends_on`.
4. The same TASK cannot exist in more than one column.
5. Move is an atomic operation (single commit).

### 4.5.1 Transactional Consistency

1. **State precondition**: each transition must validate that the card is in the source column before moving.
2. **Idempotency**: if the target state is already applied, the operation must end without a new mutation.
3. **Race conflict**: if precondition fails, abort without modifying board and record event in `activity.jsonl`.

### 4.6 Autonomous post-implementation cycle (implementer role)

1. Run relevant project tests.
2. Add comment in `## Progress Notes` with test results.
3. **Tests passed**: follow section 4.4 (move to `review/`). If `todo/` is empty for the active sprint, apply section 4.8. Pick next task (section 4.2).
4. **Tests failed**: remove `assigned_to`, move task to `todo/`, commit + push. Pick next task (section 4.2).

No step requires owner confirmation.

### 4.7 Agent project context

The agent's context is determined by the working directory where it was started: `project` and, when applicable, `subproject`. Before claim or execution, compare both fields of the task against the current context. If either field does not match, ignore the task.

### 4.8 Priority batch distribution

At sprint creation, all cards enter `resolve_board(context)/backlog/`.
Promotion to `todo/` occurs in **batches**:

1. **Anchor selection**: highest priority card in `resolve_board(context)/backlog/` of the sprint (tiebreaker: lowest numeric ID).
2. **Chain collection**: all cards linked by `depends_on` or `blocks` to the anchor, recursively.
3. **Promotion**: move anchor + chain to `resolve_board(context)/todo/`.

**Trigger**: apply whenever `todo/` has no cards from the active sprint (at sprint creation, when previous batch completes, or when starting a session).

**Sprint activation**: when activating a sprint (status: pending → active), promote **all** sprint tasks from `backlog/` to `todo/` at once. Batch distribution applies only during sprint execution (when todo/ empties before backlog/).

Within the batch in `todo/`, execution order follows section 4.2 (priority).

---

## 5. Activity Log

File: `logs/activity.jsonl` — append-only, 1 JSON per line.

Format: `{"timestamp":"ISO-8601","agent":"...","action":"...","entity_type":"task","entity_id":"TASK-NNNN","details":"...","project":"..."}`

Valid actions: `create`, `update`, `move`, `claim`, `release`, `comment`, `complete`, `delete`.

**Reading**: agents should read only the last 20 lines (`tail -20`). Never read the full file.

---

## 6. Kanban Commits

Format: `[KANBAN] <action> <entity-id>: <short description>` + `Agent: <id>` in commit body.

1 commit per logical change. Avoid micro-commits.

### 6.1 Mandatory Synchronization

- Mutable operation only completes after `commit` + `push`.
- Before editing board, run `scripts/kanban-sync-check.sh`.
- If `push` fails, stop and record pending in `activity.jsonl`.

### 6.2 Board Files are Normal Artifacts

- Files in `board/` (backlog, todo, in-progress, review, done) are NEVER "unexpected" or "dirty".
- If `git status` shows untracked or modified files in `board/`, the correct action is ALWAYS to commit and push.
- Never ask the owner what to do with board files. Commit directly.
- If `kanban-sync-check.sh` fails due to uncommitted files, the solution is: `git add` + `git commit` + `git push`.

---

## 7. Done and Archive

Daily operational destination: `board/done/`.

### 7.1 Sprint Closing

Executed automatically by section 4.4.2 or by consistency check on session start.

1. Identify all cards in `resolve_board(sprint)/done/` belonging to the sprint being closed.
2. Move those cards to `resolve_board(sprint)/archive/done/`.
3. Move sprint from `resolve_sprint(sprint)/` to `resolve_sprint(sprint)/archive/`.
4. Record in `activity.jsonl` with `action: archive`.
5. Update sprint status to `completed`.
6. Single commit: `[KANBAN] archive sprint-NNN: close sprint`.

> **Mandatory**: no sprint can have `status: closed` with cards still in `done/`. If detected, archive immediately.

---

## 8. OKRs and Sprints

Propose only when: requested by owner, start of quarter without OKR, or expired sprint.

OKR and Sprint rules are in `config.yaml`. OKR/sprint require owner approval.

### 8.1 Worktree Policy per Sprint

- Create dedicated worktree (`/tmp/<system-name>-sprint-NNN`) with dedicated branch per sprint.
- Close sprint with procedure 7.1, merge/push and worktree removal.

---

## 9. External Projects

1. Resolve task context:
   - With `subproject`: read `projects/<proj>/subprojects/<sub>/README.md`
   - Without `subproject`: read `projects/<proj>/README.md`
2. Execute implementation in the repository indicated by `repo` field of README.
3. Record progress in kanban.

### 9.1 Worktree per Project

- Each project operates in a dedicated worktree (sharing is prohibited).
- Kanban commits only in the kanban worktree.
- Validate `pwd` and `git rev-parse --show-toplevel` before commit.

### 9.2 Publishing

- Worktree must have upstream configured.
- `git fetch`/`rebase` before mutable operations.
- Prohibited: accumulating commits without push.

---

## 10. Golden Rules

1. Read this file before operating in kanban.
2. Update `acted_by` and `activity.jsonl` on every operation.
3. Respect concurrency (section 4.5).
4. Never violate the canonical schema.
5. Never alter old lines in `activity.jsonl`.
6. Use a valid agent identifier (from `config.yaml`).
7. Do not impose OKR/sprint without owner approval.
8. Evaluate acceptance criteria before moving to `review/`.
9. Run `kanban-sync-check.sh` before mutable operations.
10. Finalize mutable operation with `commit` + `push`.

---

## 12. PDF Report Generation

When asked to generate a PDF infrastructure report:

- Use the template at `/home/carlosfarah/Projects/IaC/Innovaq/docs/templates/pdf_report.py`
- Import and call `generate_pdf()` directly via Python
- Always apply `apply_accents()` for correct Portuguese accentuation
- Default footer: "Documento gerado pelo departamento de DevOps da Amazonas Inovare"
- Layout: dark gradient cover, visual section dividers, dark-header tables, page numbering
- Save the PDF to the active project's `docs/` directory, or wherever the user specifies

```python
import sys
sys.path.insert(0, "/home/carlosfarah/Projects/IaC/Innovaq/docs/templates")
from pdf_report import generate_pdf

generate_pdf(
    inputs=["path/to/file.md"],           # one or more .md files
    output="path/to/report.pdf",
    title="Report Title",
    subtitle="Subtitle",
    tasks="TASK-XXXX",
    periodo="YYYY-MM-DD a YYYY-MM-DD",
    ambiente="PRD",
    phase_labels=["Phase 1 · TASK-XXXX"],  # optional, for multi-file reports
)
```

---

## 11. Operational Efficiency

1. Progressive discovery: specific paths before global search.
2. Avoid high-verbosity commands without filters.
3. Reuse already collected context.
4. Prefer 2-3 small, targeted commands.
5. Only open large artifacts when essential.
6. Read `activity.jsonl` with `tail -20`, never the full file.
