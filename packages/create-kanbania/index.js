#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fse from 'fs-extra'
import prompts from 'prompts'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BANNER = `
${chalk.cyan('██╗  ██╗ █████╗ ███╗  ██╗██████╗  █████╗ ███╗  ██╗██╗ █████╗')}
${chalk.cyan('██║ ██╔╝██╔══██╗████╗ ██║██╔══██╗██╔══██╗████╗ ██║██║██╔══██╗')}
${chalk.cyan('█████╔╝ ███████║██╔██╗██║██████╔╝███████║██╔██╗██║██║███████║')}
${chalk.cyan('██╔═██╗ ██╔══██║██║╚████║██╔══██╗██╔══██║██║╚████║██║██╔══██║')}
${chalk.cyan('██║ ╚██╗██║  ██║██║ ╚███║██████╔╝██║  ██║██║ ╚███║██║██║  ██║')}
${chalk.cyan('╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚══╝╚═╝╚═╝  ╚═╝')}

  ${chalk.dim('AI-native kanban · file-based · multi-agent')}
`

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Lisbon',
  'Europe/Berlin',
  'Asia/Tokyo',
  'UTC',
]

async function main() {
  console.log(BANNER)

  const args = process.argv.slice(2)
  const useDefaults = args.includes('--yes') || args.includes('-y')
  const targetDir = args.find(a => !a.startsWith('-'))

  if (!targetDir) {
    console.error(chalk.red('Usage: npx create-kanbania <directory> [--yes]'))
    process.exit(1)
  }

  const absTarget = path.resolve(process.cwd(), targetDir)

  if (fs.existsSync(absTarget) && fs.readdirSync(absTarget).length > 0) {
    console.error(chalk.red(`Directory "${targetDir}" already exists and is not empty.`))
    process.exit(1)
  }

  console.log(chalk.bold(`Creating Kanbania at ${chalk.cyan(absTarget)}\n`))

  if (useDefaults) {
    console.log(chalk.dim('  Using defaults (--yes)\n'))
  }

  const answers = useDefaults
    ? { owner: process.env.USER || 'me', timezone: 'America/Sao_Paulo', agents: ['claude-code', 'codex'], git: true }
    : await prompts(
    [
      {
        type: 'text',
        name: 'owner',
        message: 'Owner name (your username or handle):',
        initial: process.env.USER || 'me',
        validate: v => v.trim().length > 0 || 'Required',
      },
      {
        type: 'select',
        name: 'timezone',
        message: 'Timezone:',
        choices: TIMEZONES.map(tz => ({ title: tz, value: tz })),
        initial: 0,
      },
      {
        type: 'multiselect',
        name: 'agents',
        message: 'Which agents will you use?',
        choices: [
          { title: 'Claude Code  (implementer)', value: 'claude-code', selected: true },
          { title: 'Codex        (reviewer)', value: 'codex', selected: true },
        ],
        min: 1,
      },
      {
        type: 'confirm',
        name: 'git',
        message: 'Initialize a git repository?',
        initial: true,
      },
    ],
    { onCancel: () => { console.log(chalk.yellow('\nCancelled.')); process.exit(0) } }
  )

  console.log()

  // ── Create directory structure ──────────────────────────────────────────────
  const dirs = [
    'board/backlog', 'board/todo', 'board/in-progress', 'board/review', 'board/done',
    'sprints', 'okrs', 'logs', 'projects', 'templates/agents',
  ]

  for (const d of dirs) {
    fse.ensureDirSync(path.join(absTarget, d))
    // keep empty dirs in git
    fs.writeFileSync(path.join(absTarget, d, '.gitkeep'), '')
  }

  process.stdout.write(chalk.green('  ✔') + ' Directory structure created\n')

  // ── config.yaml ─────────────────────────────────────────────────────────────
  const agentDefs = []
  if (answers.agents.includes('claude-code')) {
    agentDefs.push(`  - id: "claude-code"
    name: "Claude Code"
    provider: "Anthropic"`)
  }
  if (answers.agents.includes('codex')) {
    agentDefs.push(`  - id: "codex"
    name: "Codex"
    provider: "OpenAI"`)
  }

  const configYaml = `# =============================================================================
# config.yaml — Kanbania Global Configuration
# =============================================================================

owner:
  name: "${answers.owner}"
  timezone: "${answers.timezone}"

agents:
${agentDefs.join('\n')}

sprint:
  duration_days: 14
  default_capacity: 21
  naming_pattern: "sprint-NNN"

board:
  columns:
    - id: "backlog"
      name: "Backlog"
      description: "Identified tasks, awaiting prioritization"
    - id: "todo"
      name: "To Do"
      description: "Prioritized for current sprint"
    - id: "in-progress"
      name: "In Progress"
      description: "Being worked on by an agent"
    - id: "review"
      name: "Review"
      description: "Awaiting QA review"
    - id: "done"
      name: "Done"
      description: "Completed and approved"

priorities:
  - id: "critical"
    name: "Critical"
    order: 1
  - id: "high"
    name: "High"
    order: 2
  - id: "medium"
    name: "Medium"
    order: 3
  - id: "low"
    name: "Low"
    order: 4

story_points:
  allowed: [1, 2, 3, 5, 8, 13]
  max_single_task: 3
  epic_threshold: 5
  max_files_per_task: 5

labels:
  - bug
  - feature
  - refactor
  - docs
  - infra
  - security
  - performance
  - ux
  - research
  - ai-integration
  - testing
  - devops

okr:
  max_objectives_per_quarter: 3
  kr_per_objective:
    min: 2
    max: 4

paths:
  board: "board"
  okrs: "okrs"
  sprints: "sprints"
  projects: "projects"
  templates: "templates"
  logs: "logs"

subprojects:
  enabled: false
  projects_with_subprojects: []
`

  fs.writeFileSync(path.join(absTarget, 'config.yaml'), configYaml)
  process.stdout.write(chalk.green('  ✔') + ' config.yaml generated\n')

  // ── activity log ─────────────────────────────────────────────────────────────
  fs.writeFileSync(path.join(absTarget, 'logs/activity.jsonl'), '')
  fs.writeFileSync(path.join(absTarget, 'logs/rework-pending.jsonl'), '')
  process.stdout.write(chalk.green('  ✔') + ' Log files created\n')

  // ── Copy templates from this package ────────────────────────────────────────
  const templatesSource = path.join(__dirname, 'templates')
  if (fs.existsSync(templatesSource)) {
    fse.copySync(templatesSource, absTarget, { overwrite: false })
  }

  // ── AGENTS.md ────────────────────────────────────────────────────────────────
  const agentsSection = answers.agents.map(a => {
    const roles = { 'claude-code': 'implementer', 'codex': 'reviewer' }
    return `  - id: "${a}"\n    role: "${roles[a] || 'both'}"`
  }).join('\n')

  const agentsMd = `# AGENTS.md — Kanban System Protocol

> Operating rules for the Kanbania system.

## Overview

File-based kanban with Git versioning. Each task is a Markdown file.

- **File = entity** | **Folder = status** | **Git = history**

## Agents

${agentDefs.join('\n')}

## Workflow

1. Implementer claims a task from \`board/todo/\`
2. Works on it, moves to \`board/in-progress/\`
3. On completion, moves to \`board/review/\`
4. Reviewer approves → \`board/done/\` | Rejects → back to \`board/in-progress/\`

## Task Schema

\`\`\`yaml
---
id: TASK-NNNN
title: "Task title"
project: my-project
sprint: sprint-001
priority: high        # critical | high | medium | low
story_points: 3       # 1 | 2 | 3 | 5 | 8 | 13
status: todo          # backlog | todo | in-progress | review | done
assigned_to: ${answers.agents[0] || 'claude-code'}
---
\`\`\`

## Commit Convention

\`[KANBAN] <action> <TASK-ID>: <description>\`
`

  fs.writeFileSync(path.join(absTarget, 'AGENTS.md'), agentsMd)
  process.stdout.write(chalk.green('  ✔') + ' AGENTS.md created\n')

  // ── Agent instruction files ──────────────────────────────────────────────────
  if (answers.agents.includes('claude-code')) {
    const claudeMd = `# CLAUDE.md — Claude Code Agent Instructions

- Identifier: \`claude-code\`
- Role: implementer
- On start: read \`sprints/current.md\`, check \`board/todo/\` for next task.
- Commits: \`[KANBAN] <action> <TASK-ID>: <description>\` with \`Agent: claude-code\`.
- Language: communicate with owner in the owner's language.
- Do not ask for confirmation on routine kanban operations.
`
    fs.writeFileSync(path.join(absTarget, 'CLAUDE.md'), claudeMd)
  }

  if (answers.agents.includes('codex')) {
    const codexMd = `# CODEX.md — Codex Agent Instructions

- Identifier: \`codex\`
- Role: reviewer (QA gate)
- On start: check \`board/review/\` for tasks awaiting review.
- Approve: move task to \`board/done/\`, update frontmatter \`status: done\`.
- Reject: move task back to \`board/in-progress/\`, add rejection notes.
- Commits: \`[KANBAN] <action> <TASK-ID>: <description>\` with \`Agent: codex\`.
`
    fs.writeFileSync(path.join(absTarget, 'CODEX.md'), codexMd)
  }

  process.stdout.write(chalk.green('  ✔') + ' Agent instruction files created\n')

  // ── .gitignore ───────────────────────────────────────────────────────────────
  fs.writeFileSync(path.join(absTarget, '.gitignore'), 'config.local.yaml\n*.log\n')
  process.stdout.write(chalk.green('  ✔') + ' .gitignore created\n')

  // ── git init ─────────────────────────────────────────────────────────────────
  if (answers.git) {
    const { execSync } = await import('child_process')
    try {
      execSync('git init', { cwd: absTarget, stdio: 'ignore' })
      execSync('git add .', { cwd: absTarget, stdio: 'ignore' })
      execSync('git commit -m "chore: initialize kanbania"', { cwd: absTarget, stdio: 'ignore' })
      process.stdout.write(chalk.green('  ✔') + ' Git repository initialized\n')
    } catch {
      process.stdout.write(chalk.yellow('  ⚠') + ' Git init skipped (git not found)\n')
    }
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log(`
${chalk.bold.green('  Done!')} Your Kanbania is ready at ${chalk.cyan(targetDir)}

  ${chalk.bold('Next steps:')}

  ${chalk.dim('1.')} Add your first project:
     ${chalk.cyan(`mkdir -p ${targetDir}/projects/my-project`)}

  ${chalk.dim('2.')} Create your first task:
     ${chalk.cyan(`cp ${targetDir}/AGENTS.md ${targetDir}/board/backlog/TASK-0001.md`)}
     ${chalk.dim('(edit the frontmatter with your task details)')}

  ${chalk.dim('3.')} Start the dashboard (requires Node.js):
     ${chalk.cyan('https://github.com/kadufarah1979/kanbania → dashboard/')}

  ${chalk.dim('4.')} Point your AI agent at CLAUDE.md or CODEX.md and let it work.

  ${chalk.dim('Docs:')} https://github.com/kadufarah1979/kanbania
`)
}

main().catch(err => {
  console.error(chalk.red('\nError:'), err.message)
  process.exit(1)
})
