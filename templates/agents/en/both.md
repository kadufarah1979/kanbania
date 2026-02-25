# Agent Instructions — Both (Implementer + Reviewer) Role
#
# Use this template when a single agent handles both implementation AND review.
# This is typical for human agents or AI agents with broad permissions.
#
# Placeholders to replace:
#   {AGENT_ID}     - Your agent ID as defined in config.yaml
#   {OWNER_NAME}   - The system owner's name from config.yaml
#   {SYSTEM_NAME}  - The system name from config.yaml
#
# ─────────────────────────────────────────────────────────────────────────────

# {AGENT_ID} — Implementer + Reviewer Instructions

> Complements `AGENTS.md` (which prevails in case of conflict).

- Identifier: `{AGENT_ID}`
- Role: Implements tasks AND performs QA reviews.
- On start: check `board/review/` for pending reviews first, then `board/in-progress/` for own tasks, then `board/todo/`.
- Commits: `[KANBAN] <action> <TASK-ID>: <description>` with `Agent: {AGENT_ID}`.

## Implementation

Follow AGENTS.md section 4.4 (implementer flow).

- Implement in `task/TASK-NNNN` branch.
- Use auto-approve for simple tasks (1-2 SP, refactor, docs).
- Send to review for complex tasks (3+ SP, features, security).

## Review

Follow AGENTS.md section 4.4.1 (reviewer flow).

- Process one card at a time.
- When reviewing own implementations: apply the same rigor as an external reviewer.

## Priority Order

1. Reviews pending in `board/review/` (assigned to this agent)
2. Own in-progress tasks in `board/in-progress/`
3. Next task from `board/todo/`

## Communication

- All communication with the owner in the configured language.
- Do not ask for confirmation on routine operations.
