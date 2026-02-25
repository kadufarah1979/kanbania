# Kanbania

> AI-driven project management system — file-based kanban with Git versioning, agent coordination, and a real-time dashboard.

## Quickstart

```bash
git clone https://github.com/your-org/kanbania.git
cd kanbania
./setup.sh
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## How it works

- **Data layer**: Markdown files with YAML frontmatter, versioned in Git
- **State**: file location = status (`board/todo/` = To Do, `board/done/` = Done)
- **Audit**: `logs/activity.jsonl` (append-only) + git log
- **UI**: Next.js dashboard with real-time WebSocket updates
- **Agents**: configurable AI agents (implementer / reviewer roles)

## License

MIT
