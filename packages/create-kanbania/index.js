#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fse from 'fs-extra'
import prompts from 'prompts'
import chalk from 'chalk'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ora = require('ora')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPO_URL = 'https://github.com/kadufarah1979/kanbania.git'
const DEFAULT_INSTALL_DIR = path.join(os.homedir(), '.kanbania')

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

function run(cmd, cwd, opts = {}) {
  execSync(cmd, { cwd, stdio: opts.silent ? 'ignore' : 'pipe', ...opts })
}

function commandExists(cmd) {
  try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return true }
  catch { return false }
}

function writeSystemdService(name, description, execStart, envVars = {}) {
  const systemdDir = path.join(os.homedir(), '.config', 'systemd', 'user')
  fse.ensureDirSync(systemdDir)
  const envLines = Object.entries(envVars).map(([k, v]) => `Environment="${k}=${v}"`).join('\n')
  const content = `[Unit]
Description=${description}
After=network.target

[Service]
Type=simple
${envLines}
ExecStart=${execStart}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`
  fs.writeFileSync(path.join(systemdDir, `${name}.service`), content)
}

async function main() {
  console.log(BANNER)

  const args = process.argv.slice(2)
  const useDefaults = args.includes('--yes') || args.includes('-y')
  const targetDir = args.find(a => !a.startsWith('-'))

  if (!targetDir) {
    console.error(chalk.red('Usage: npx create-kanbania <workspace-dir> [--yes]'))
    process.exit(1)
  }

  const absTarget = path.resolve(process.cwd(), targetDir)

  if (fs.existsSync(absTarget) && fs.readdirSync(absTarget).length > 0) {
    console.error(chalk.red(`Directory "${targetDir}" already exists and is not empty.`))
    process.exit(1)
  }

  console.log(chalk.bold(`Creating Kanbania workspace at ${chalk.cyan(absTarget)}\n`))

  if (useDefaults) console.log(chalk.dim('  Using defaults (--yes)\n'))

  // ── Phase 1: workspace prompts ───────────────────────────────────────────────
  const ws = useDefaults
    ? { owner: process.env.USER || 'me', timezone: 'America/Sao_Paulo', agents: ['claude-code', 'codex'], git: true }
    : await prompts(
      [
        {
          type: 'text',
          name: 'owner',
          message: 'Owner name:',
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

  // ── Phase 2: dashboard prompts ───────────────────────────────────────────────
  const dash = useDefaults
    ? { install: false }
    : await prompts(
      [
        {
          type: 'confirm',
          name: 'install',
          message: 'Install the Kanbania dashboard? (requires git · ~2-3 min)',
          initial: true,
        },
        {
          type: prev => prev ? 'text' : null,
          name: 'installDir',
          message: 'Where to install the dashboard?',
          initial: DEFAULT_INSTALL_DIR,
        },
        {
          type: prev => prev !== null ? 'number' : null,
          name: 'dashPort',
          message: 'Dashboard port:',
          initial: 8765,
        },
        {
          type: prev => prev !== null ? 'number' : null,
          name: 'wsPort',
          message: 'WebSocket server port:',
          initial: 8766,
        },
        {
          type: (_, values) => values.install ? 'confirm' : null,
          name: 'systemd',
          message: 'Set up systemd services (auto-start on login)?',
          initial: true,
        },
        {
          type: (_, values) => values.install ? 'confirm' : null,
          name: 'startNow',
          message: 'Start the dashboard now?',
          initial: true,
        },
      ],
      { onCancel: () => { console.log(chalk.yellow('\nCancelled.')); process.exit(0) } }
    )

  console.log()

  // ── Create workspace ─────────────────────────────────────────────────────────
  const dirs = [
    'board/backlog', 'board/todo', 'board/in-progress', 'board/review', 'board/done',
    'sprints', 'okrs', 'logs', 'projects', 'templates/agents',
  ]
  for (const d of dirs) {
    fse.ensureDirSync(path.join(absTarget, d))
    fs.writeFileSync(path.join(absTarget, d, '.gitkeep'), '')
  }
  process.stdout.write(chalk.green('  ✔') + ' Workspace structure created\n')

  // config.yaml
  const agentDefs = []
  if (ws.agents.includes('claude-code')) agentDefs.push(`  - id: "claude-code"\n    name: "Claude Code"\n    provider: "Anthropic"`)
  if (ws.agents.includes('codex')) agentDefs.push(`  - id: "codex"\n    name: "Codex"\n    provider: "OpenAI"`)

  const configYaml = `# config.yaml — Kanbania Global Configuration

owner:
  name: "${ws.owner}"
  timezone: "${ws.timezone}"

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
    - id: "todo"
      name: "To Do"
    - id: "in-progress"
      name: "In Progress"
    - id: "review"
      name: "Review"
    - id: "done"
      name: "Done"

priorities:
  - { id: "critical", name: "Critical", order: 1 }
  - { id: "high",     name: "High",     order: 2 }
  - { id: "medium",   name: "Medium",   order: 3 }
  - { id: "low",      name: "Low",      order: 4 }

story_points:
  allowed: [1, 2, 3, 5, 8, 13]
  max_single_task: 3
  epic_threshold: 5
  max_files_per_task: 5

labels: [bug, feature, refactor, docs, infra, security, performance, ux, research, ai-integration, testing, devops]

okr:
  max_objectives_per_quarter: 3
  kr_per_objective: { min: 2, max: 4 }

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

  fs.writeFileSync(path.join(absTarget, 'logs/activity.jsonl'), '')
  fs.writeFileSync(path.join(absTarget, 'logs/rework-pending.jsonl'), '')

  // AGENTS.md
  const agentsMd = `# AGENTS.md — Kanban System Protocol

## Agents
${agentDefs.join('\n')}

## Workflow
1. Implementer claims task from \`board/todo/\`
2. Works, moves to \`board/in-progress/\`
3. On completion, moves to \`board/review/\`
4. Reviewer approves → \`board/done/\` | Rejects → \`board/in-progress/\`

## Task Schema
\`\`\`yaml
---
id: TASK-NNNN
title: "Task title"
project: my-project
sprint: sprint-001
priority: high
story_points: 3
status: todo
assigned_to: ${ws.agents[0] || 'claude-code'}
---
\`\`\`

## Commit Convention
\`[KANBAN] <action> <TASK-ID>: <description>\`
`
  fs.writeFileSync(path.join(absTarget, 'AGENTS.md'), agentsMd)

  if (ws.agents.includes('claude-code')) {
    fs.writeFileSync(path.join(absTarget, 'CLAUDE.md'), `# CLAUDE.md — Claude Code Agent Instructions

- Identifier: \`claude-code\`
- Role: implementer
- On start: read \`sprints/current.md\`, check \`board/todo/\` for next task.
- Commits: \`[KANBAN] <action> <TASK-ID>: <description>\` with \`Agent: claude-code\`.
- Language: communicate with owner in the owner's language.
- Do not ask for confirmation on routine kanban operations.
`)
  }

  if (ws.agents.includes('codex')) {
    fs.writeFileSync(path.join(absTarget, 'CODEX.md'), `# CODEX.md — Codex Agent Instructions

- Identifier: \`codex\`
- Role: reviewer (QA gate)
- On start: check \`board/review/\` for tasks awaiting review.
- Approve: move task to \`board/done/\`, update frontmatter \`status: done\`.
- Reject: move task back to \`board/in-progress/\`, add rejection notes.
- Commits: \`[KANBAN] <action> <TASK-ID>: <description>\` with \`Agent: codex\`.
`)
  }

  fs.writeFileSync(path.join(absTarget, '.gitignore'), 'config.local.yaml\n*.log\n')
  process.stdout.write(chalk.green('  ✔') + ' Agent files and .gitignore created\n')

  if (ws.git) {
    try {
      run('git init', absTarget, { silent: true })
      run('git add .', absTarget, { silent: true })
      run('git commit -m "chore: initialize kanbania workspace"', absTarget, { silent: true })
      process.stdout.write(chalk.green('  ✔') + ' Git repository initialized\n')
    } catch {
      process.stdout.write(chalk.yellow('  ⚠') + ' Git init skipped\n')
    }
  }

  // ── Phase 2: Dashboard installation ─────────────────────────────────────────
  if (!dash.install) {
    printDone(targetDir, absTarget, null, null, null)
    return
  }

  const installDir = dash.installDir || DEFAULT_INSTALL_DIR
  const dashPort   = dash.dashPort  || 8765
  const wsPort     = dash.wsPort    || 8766
  const dashDir    = path.join(installDir, 'dashboard')

  console.log()

  // Check dependencies
  if (!commandExists('git')) {
    console.error(chalk.red('  ✖ git not found. Please install git and retry.'))
    process.exit(1)
  }
  if (!commandExists('node')) {
    console.error(chalk.red('  ✖ node not found. Please install Node.js 18+ and retry.'))
    process.exit(1)
  }

  // Clone
  if (fs.existsSync(installDir)) {
    process.stdout.write(chalk.yellow('  ⚠') + ` Dashboard directory already exists at ${installDir} — skipping clone\n`)
  } else {
    const spinner = ora(`  Cloning kanbania repository…`).start()
    try {
      run(`git clone --depth 1 ${REPO_URL} "${installDir}"`, null, { silent: true })
      spinner.succeed(chalk.green('  Repository cloned'))
    } catch (e) {
      spinner.fail(chalk.red('  Clone failed: ' + e.message))
      process.exit(1)
    }
  }

  // npm install
  {
    const spinner = ora('  Installing dashboard dependencies (npm install)…').start()
    try {
      run('npm install --prefer-offline', dashDir, { silent: true })
      spinner.succeed(chalk.green('  Dependencies installed'))
    } catch (e) {
      spinner.fail(chalk.red('  npm install failed: ' + e.message))
      process.exit(1)
    }
  }

  // npm run build
  {
    const spinner = ora('  Building dashboard (npm run build)…').start()
    try {
      run('npm run build', dashDir, { silent: true })
      spinner.succeed(chalk.green('  Dashboard built'))
    } catch (e) {
      spinner.fail(chalk.red('  Build failed: ' + e.message))
      process.exit(1)
    }
  }

  // Copy static assets for standalone mode
  {
    const spinner = ora('  Preparing standalone server…').start()
    try {
      fse.copySync(
        path.join(dashDir, '.next/static'),
        path.join(dashDir, '.next/standalone/.next/static'),
        { overwrite: true }
      )
      if (fs.existsSync(path.join(dashDir, 'public'))) {
        fse.copySync(
          path.join(dashDir, 'public'),
          path.join(dashDir, '.next/standalone/public'),
          { overwrite: true }
        )
      }
      spinner.succeed(chalk.green('  Standalone server prepared'))
    } catch (e) {
      spinner.fail(chalk.red('  Static copy failed: ' + e.message))
      process.exit(1)
    }
  }

  // config.local.yaml
  fs.writeFileSync(
    path.join(installDir, 'config.local.yaml'),
    `# Machine-specific config — gitignored\nkanban_root: "${absTarget}"\n`
  )
  process.stdout.write(chalk.green('  ✔') + ' config.local.yaml created\n')

  // ── Systemd services ─────────────────────────────────────────────────────────
  if (dash.systemd) {
    const nodeBin = process.execPath
    const serverJs = path.join(dashDir, '.next/standalone/server.js')
    const serverTs = path.join(dashDir, 'server.ts')
    const tsxBin   = path.join(dashDir, 'node_modules/.bin/tsx')

    writeSystemdService(
      'kb-dashboard',
      'Kanbania Dashboard (Next.js)',
      `${nodeBin} ${serverJs}`,
      { PORT: String(dashPort), KANBAN_ROOT: absTarget }
    )

    writeSystemdService(
      'kb-dashboard-ws',
      'Kanbania Dashboard - WebSocket server',
      `${nodeBin} ${tsxBin} ${serverTs}`,
      { PORT: String(wsPort), KANBAN_ROOT: absTarget }
    )

    try {
      run('systemctl --user daemon-reload', null, { silent: true })
      run('systemctl --user enable kb-dashboard kb-dashboard-ws', null, { silent: true })
      process.stdout.write(chalk.green('  ✔') + ' Systemd services enabled (kb-dashboard, kb-dashboard-ws)\n')
    } catch {
      process.stdout.write(chalk.yellow('  ⚠') + ' systemctl not available — service files written but not enabled\n')
    }
  }

  // ── Start now ────────────────────────────────────────────────────────────────
  if (dash.startNow) {
    try {
      run('systemctl --user start kb-dashboard kb-dashboard-ws', null, { silent: true })
      process.stdout.write(chalk.green('  ✔') + ' Services started\n')
    } catch {
      // fallback: start manually
      const serverJs = path.join(dashDir, '.next/standalone/server.js')
      const logFile  = path.join(os.tmpdir(), 'kanbania-next.log')
      run(
        `KANBAN_ROOT="${absTarget}" PORT=${dashPort} nohup node "${serverJs}" > "${logFile}" 2>&1 &`,
        null,
        { silent: true, shell: true }
      )
      process.stdout.write(chalk.green('  ✔') + ` Dashboard started (log: ${logFile})\n`)
    }
  }

  printDone(targetDir, absTarget, installDir, dashPort, wsPort)
}

function printDone(targetDir, absTarget, installDir, dashPort, wsPort) {
  const dashLine = dashPort
    ? `\n  ${chalk.bold('Dashboard:')} ${chalk.cyan(`http://localhost:${dashPort}`)}\n`
    : ''

  console.log(`
${chalk.bold.green('  Done!')} Your Kanbania is ready.
${dashLine}
  ${chalk.bold('Workspace:')}  ${chalk.cyan(absTarget)}
  ${chalk.bold('Dashboard:')}  ${installDir ? chalk.cyan(installDir) : chalk.dim('not installed')}

  ${chalk.bold('Next steps:')}

  ${chalk.dim('1.')} Create your first project:
     ${chalk.cyan(`mkdir -p ${targetDir}/projects/my-project`)}

  ${chalk.dim('2.')} Point your AI agent at ${chalk.cyan('CLAUDE.md')} and let it work.

  ${chalk.dim('3.')} Manage services:
     ${chalk.cyan('systemctl --user status kb-dashboard kb-dashboard-ws')}
     ${chalk.cyan('systemctl --user restart kb-dashboard')}

  ${chalk.dim('Docs:')} https://github.com/kadufarah1979/kanbania
`)
}

main().catch(err => {
  console.error(chalk.red('\nError:'), err.message)
  process.exit(1)
})
