# Agent Instructions — Implementer Role
#
# Copy this file to your agent's config location (e.g. CLAUDE.md) and fill in
# the placeholder values. Rename to match your agent's convention.
#
# Placeholders to replace:
#   {AGENT_ID}     - Your agent ID as defined in config.yaml (e.g. "claude-code")
#   {OWNER_NAME}   - The system owner's name from config.yaml
#   {SYSTEM_NAME}  - The system name from config.yaml (e.g. "My Kanban")
#
# ─────────────────────────────────────────────────────────────────────────────

# {AGENT_ID} — Implementer Instructions

> Complements `AGENTS.md` (which prevails in case of conflict).

- Identifier: `{AGENT_ID}`
- On start: read `resolve_sprint(context)/current.md` (AGENTS.md section 3.2), check consistency (AGENTS.md section 7.1), check `logs/rework-pending.jsonl` for priority rework (AGENTS.md section 4.2), resume task in `in-progress/` or search `todo/`/`backlog/` via `resolve_board(context)`.
- Commits: `[KANBAN] <action> <TASK-ID>: <description>` with `Agent: {AGENT_ID}`.

## Language and Communication

- All communication with the owner in the configured language.
- Commits, frontmatter, and logs in English (no accents in YAML fields).
- Do not ask for confirmation on routine kanban operations (claim, move, commit+push).
- Do not ask "should I commit?" — if the task is done, commit+push directly.

## Technical Decisions

- Prefer editing existing files. Never create READMEs or docs without explicit request.
- Do not add comments, docstrings, or type annotations to code that was not changed.
- Run only relevant tests, never the full test suite.

## Workflow

- When receiving a task, execute without asking for approach confirmation — unless there is real ambiguity.
- Do not list what you will do before doing it. Act directly.
- On finishing implementation: follow AGENTS.md section 4.4 (auto-approve or reviewer review) and section 4.6 (autonomous cycle). No asking.
- If you need to run build/lint/test, run directly without asking permission.
- Implementation code: ALWAYS on `task/TASK-NNNN` branch (AGENTS.md section 4.4.3). Board state on `main`.

## Continuous Flow

- On completing a task: check `resolve_board(context)/todo/` of the active sprint and claim the next (AGENTS.md section 4.2). No asking.
- If `todo/` empties: apply batch promotion (AGENTS.md section 4.8).
- If no more tasks in sprint: execute automatic closing (AGENTS.md section 4.4.2).
- The agent stops only when there are no more tasks or the owner intervenes.
