"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Terminal, GitBranch, Server, FolderTree,
  Play, Square, Eye, ArrowRight, Shield, Bot, Layers,
} from "lucide-react";

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b last:border-0">
      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded whitespace-nowrap shrink-0">
        {cmd}
      </code>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Help</h1>
        <p className="text-muted-foreground mt-1">
          Manual de referencia do Kanbania — comandos, workflow e estrutura.
        </p>
      </div>

      <Tabs defaultValue="quickstart" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="quickstart" className="gap-1.5">
            <Rocket className="h-4 w-4" /> Inicio Rapido
          </TabsTrigger>
          <TabsTrigger value="commands" className="gap-1.5">
            <Terminal className="h-4 w-4" /> Comandos
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1.5">
            <GitBranch className="h-4 w-4" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="subprojects" className="gap-1.5">
            <Layers className="h-4 w-4" /> Subprojetos
          </TabsTrigger>
          <TabsTrigger value="systemd" className="gap-1.5">
            <Server className="h-4 w-4" /> Systemd & Watchdog
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5">
            <FolderTree className="h-4 w-4" /> Estrutura
          </TabsTrigger>
        </TabsList>

        {/* Inicio Rapido */}
        <TabsContent value="quickstart" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" /> Iniciar agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O Kanbania usa dois agentes autonomos: <Badge variant="outline">claude-code</Badge> (implementador) e <Badge variant="outline">codex</Badge> (revisor QA).
              </p>
              <CommandRow cmd="systemctl --user start kb-claude-code" desc="Inicia o servico do claude-code" />
              <CommandRow cmd="systemctl --user start kb-codex" desc="Inicia o servico do codex" />
              <CommandRow cmd="systemctl --user start kb-claude-code kb-codex" desc="Inicia ambos os agentes" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-5 w-5" /> Parar agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CommandRow cmd="systemctl --user stop kb-claude-code" desc="Para o claude-code" />
              <CommandRow cmd="systemctl --user stop kb-codex" desc="Para o codex" />
              <CommandRow cmd="systemctl --user stop kb-claude-code kb-codex" desc="Para ambos os agentes" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Verificar status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CommandRow cmd="scripts/kb.sh status" desc="Mostra resumo do board e tasks ativas" />
              <CommandRow cmd="journalctl --user -u kb-claude-code -f" desc="Acompanha logs do claude-code em tempo real" />
              <CommandRow cmd="journalctl --user -u kb-codex -f" desc="Acompanha logs do codex em tempo real" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comandos */}
        <TabsContent value="commands" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>kb.sh — CLI do kanban</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CommandRow cmd="kb.sh claim TASK-XXXX" desc="Move task de backlog para in-progress" />
              <CommandRow cmd="kb.sh review TASK-XXXX" desc="Move task de in-progress para review (aciona codex)" />
              <CommandRow cmd="kb.sh approve TASK-XXXX" desc="Adiciona anotacao de aprovacao a task em review" />
              <CommandRow cmd="kb.sh resubmit TASK-XXXX" desc="Re-aciona review do codex apos fix" />
              <CommandRow cmd="kb.sh complete-sprint SPRINT-ID" desc="Encerra sprint, arquiva tasks e verifica OKR" />
              <CommandRow cmd="kb.sh status" desc="Mostra resumo do board" />
              <CommandRow cmd="kb.sh batch-review T1 T2 --confirm" desc="Review de multiplas tasks de uma vez" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scripts de operacao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CommandRow cmd="kanban-lint.sh" desc="Valida frontmatter de todas as tasks no board" />
              <CommandRow cmd="kanban-sync-check.sh" desc="Verifica consistencia entre board, sprints e logs" />
              <CommandRow cmd="board-monitor.sh" desc="Monitor visual do board no terminal" />
              <CommandRow cmd="card-slice.sh" desc="Decompoe uma task grande em sub-tasks" />
              <CommandRow cmd="pre-review-check.sh" desc="Checklist pre-review (lint, build, testes)" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scripts de automacao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CommandRow cmd="kb-loop.sh" desc="Loop principal dos agentes (executado pelo systemd)" />
              <CommandRow cmd="kb-watchdog.sh" desc="Watchdog que reinicia agentes travados" />
              <CommandRow cmd="agent-heartbeat.sh" desc="Registra heartbeat do agente no log" />
              <CommandRow cmd="auto-close-sprint.sh" desc="Fecha sprint automaticamente ao atingir data final" />
              <CommandRow cmd="update-agent-status.sh" desc="Atualiza status do agente no board" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scripts do codex (QA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CommandRow cmd="codex-qa-session.sh" desc="Inicia sessao de review do codex" />
              <CommandRow cmd="codex-review-queue.sh" desc="Lista tasks aguardando review" />
              <CommandRow cmd="trigger-codex-review.sh" desc="Aciona review do codex para uma task" />
              <CommandRow cmd="trigger-codex-fix.sh" desc="Aciona fix do codex apos reprovacao" />
              <CommandRow cmd="cron-codex-review.sh" desc="Cron job para reviews periodicas" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CI/CD e utilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CommandRow cmd="cicd-trigger-pipeline.sh" desc="Dispara pipeline CI/CD para um projeto" />
              <CommandRow cmd="cicd-analyze-error.sh" desc="Analisa erros de pipeline e sugere fix" />
              <CommandRow cmd="cicd-create-task.sh" desc="Cria task a partir de falha de CI/CD" />
              <CommandRow cmd="extract-token-usage.sh" desc="Extrai metricas de uso de tokens dos logs" />
              <CommandRow cmd="generate-task-instructions.sh" desc="Gera instrucoes detalhadas para uma task" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" /> Fluxo de uma task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">backlog</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">todo</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="default">in-progress</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">review</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline">done</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>backlog:</strong> Tasks planejadas mas ainda nao priorizadas para sprint.</p>
                <p><strong>todo:</strong> Tasks na sprint ativa, prontas para claim por um agente.</p>
                <p><strong>in-progress:</strong> Agente fez claim e esta implementando. Branch <code className="bg-muted px-1 rounded">task/TASK-NNNN</code> criada.</p>
                <p><strong>review:</strong> Implementacao concluida, aguardando QA do codex.</p>
                <p><strong>done:</strong> Aprovada pelo codex (ou auto-approve para tasks simples).</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" /> Papeis dos agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge>claude-code</Badge>
                  <span className="text-sm font-medium">Implementador</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Faz claim de tasks, cria branches, implementa codigo, roda testes e move para review ou done (auto-approve).
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge>codex</Badge>
                  <span className="text-sm font-medium">Revisor QA</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revisa tasks em review. Aprova (move para done) ou reprova (move para in-progress com feedback).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Regras importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Tasks com <code className="bg-muted px-1 rounded">&gt;= 5 SP</code> devem ser decompostas antes de entrar na sprint.</li>
                <li>Tasks que alterem <code className="bg-muted px-1 rounded">&gt; 5 arquivos</code> devem ser decompostas.</li>
                <li>Codigo vai em branch <code className="bg-muted px-1 rounded">task/TASK-NNNN</code>. Board state vai direto em main.</li>
                <li>Commits seguem o padrao: <code className="bg-muted px-1 rounded">[KANBAN] acao TASK-ID: descricao</code>.</li>
                <li>O codex nunca implementa — apenas revisa, aprova ou reprova.</li>
                <li>Agentes validam <code className="bg-muted px-1 rounded">project</code> + <code className="bg-muted px-1 rounded">subproject</code> antes de qualquer claim. Tasks fora do contexto sao ignoradas.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subprojetos */}
        <TabsContent value="subprojects" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" /> O que sao subprojetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Subprojetos permitem que um projeto grande seja dividido em areas independentes, cada uma com seu proprio board, sprint e OKRs — sem interferir nos demais.
              </p>
              <p className="text-sm text-muted-foreground">
                Exemplo: o projeto <Badge variant="outline">tecpag</Badge> pode ter os subprojetos <Badge variant="outline">tecpag-software</Badge>, <Badge variant="outline">tecpag-infra</Badge> e <Badge variant="outline">tecpag-pci</Badge>, cada um com cadencia propria.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quando usar subprojetos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>O projeto tem areas com tecnologias ou times distintos.</li>
                <li>Cada area precisa de sprint e capacidade proprias.</li>
                <li>Tasks de areas diferentes nao tem dependencias entre si.</li>
                <li>O backlog global esta crescendo demais para um unico board.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estrutura de pastas</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`projects/
└── <projeto>/
    ├── README.md               # projeto raiz
    └── subprojects/
        └── <subprojeto>/
            ├── README.md       # repo, stack, responsavel
            ├── board/
            │   ├── backlog/
            │   ├── todo/
            │   ├── in-progress/
            │   ├── review/
            │   └── done/
            ├── sprints/
            │   └── current.md
            └── okrs/           # opcional`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campo subproject na task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tasks de subprojetos carregam o campo <code className="bg-muted px-1 rounded">subproject</code> no frontmatter. O campo e opcional — tasks sem ele usam o board global.
              </p>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`---
id: TASK-0500
project: tecpag
subproject: tecpag-infra
sprint: sprint-001
priority: high
---`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolucao de caminho de board</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Os agentes usam <code className="bg-muted px-1 rounded">resolve_board(task)</code> e <code className="bg-muted px-1 rounded">resolve_sprint(task)</code> (AGENTS.md secao 3.2) para determinar onde operar:
              </p>
              <div className="space-y-1">
                <CommandRow cmd="subproject presente" desc="→ projects/<proj>/subprojects/<sub>/board/" />
                <CommandRow cmd="board proprio do projeto" desc="→ projects/<proj>/board/" />
                <CommandRow cmd="sem subprojeto (legado)" desc="→ board/" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como ativar subprojetos num projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Criar <code className="bg-muted px-1 rounded">projects/&lt;proj&gt;/subprojects/&lt;sub&gt;/README.md</code> com campos <code className="bg-muted px-1 rounded">id</code>, <code className="bg-muted px-1 rounded">parent</code>, <code className="bg-muted px-1 rounded">name</code>, <code className="bg-muted px-1 rounded">repo</code>, <code className="bg-muted px-1 rounded">status</code>.</li>
                <li>Criar as pastas <code className="bg-muted px-1 rounded">board/</code> e <code className="bg-muted px-1 rounded">sprints/</code> dentro do subprojeto.</li>
                <li>Adicionar o slug do projeto em <code className="bg-muted px-1 rounded">config.yaml → subprojects.projects_with_subprojects</code>.</li>
                <li>Novas tasks do subprojeto ja nascem com <code className="bg-muted px-1 rounded">subproject: &lt;sub&gt;</code> no frontmatter.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Isolamento e compatibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Agentes validam <code className="bg-muted px-1 rounded">project</code> + <code className="bg-muted px-1 rounded">subproject</code> antes de qualquer claim ou move.</li>
                <li>Tasks de subprojetos diferentes nunca sao misturadas na mesma sessao do codex.</li>
                <li>Projetos sem subprojetos continuam operando exatamente como antes — zero breaking change.</li>
                <li>Rollback disponivel: <code className="bg-muted px-1 rounded">git checkout pre-subprojects-20260223 -- AGENTS.md config.yaml templates/task.md CLAUDE.md</code></li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Systemd & Watchdog */}
        <TabsContent value="systemd" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicos systemd</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Os agentes rodam como servicos systemd do usuario. Os arquivos de unit ficam em <code className="bg-muted px-1 rounded">~/.config/systemd/user/</code>.
              </p>
              <CommandRow cmd="systemctl --user status kb-claude-code" desc="Status do servico claude-code" />
              <CommandRow cmd="systemctl --user status kb-codex" desc="Status do servico codex" />
              <CommandRow cmd="systemctl --user restart kb-claude-code" desc="Reinicia claude-code" />
              <CommandRow cmd="journalctl --user -u kb-claude-code -f" desc="Logs do systemd em tempo real" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Watchdog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O watchdog monitora heartbeats dos agentes e reinicia os que parecem travados.
              </p>
              <CommandRow cmd="scripts/kb-watchdog.sh" desc="Executa verificacao de watchdog (normalmente via cron)" />
              <CommandRow cmd="scripts/agent-heartbeat.sh" desc="Registra heartbeat manual" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Agente nao inicia: verificar <code className="bg-muted px-1 rounded">journalctl --user -u kb-claude-code</code> para erros.</li>
                <li>Agente trava: o watchdog deve reiniciar automaticamente. Verificar logs em <code className="bg-muted px-1 rounded">logs/</code>.</li>
                <li>Task presa em in-progress: verificar se ha branch ativa com <code className="bg-muted px-1 rounded">git branch -a | grep task/</code>.</li>
                <li>Build falha: rodar <code className="bg-muted px-1 rounded">scripts/pre-review-check.sh</code> para diagnostico.</li>
                <li>Board inconsistente: rodar <code className="bg-muted px-1 rounded">scripts/kanban-lint.sh</code> e <code className="bg-muted px-1 rounded">scripts/kanban-sync-check.sh</code>.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estrutura */}
        <TabsContent value="structure" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de diretorios</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`kanbania/
├── board/                  # Board global (projetos simples)
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── review/
│   └── done/
├── archive/                # Tasks arquivadas
├── sprints/                # Sprints globais
│   └── current.md
├── okrs/                   # OKRs por trimestre
├── projects/
│   └── <projeto>/
│       ├── README.md       # projeto raiz
│       └── subprojects/    # opcional — projetos com areas distintas
│           └── <sub>/
│               ├── README.md
│               ├── board/  # board isolado do subprojeto
│               └── sprints/
├── templates/
├── config.yaml             # Configuracao central
├── logs/
│   └── activity.jsonl
├── scripts/
├── dashboard/              # Dashboard web (Next.js)
└── AGENTS.md               # Protocolo canonico`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arquivos importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <CommandRow cmd="AGENTS.md" desc="Protocolo canonico — regras de operacao dos agentes" />
                <CommandRow cmd="CLAUDE.md" desc="Instrucoes especificas do claude-code" />
                <CommandRow cmd="CODEX.md" desc="Instrucoes especificas do codex" />
                <CommandRow cmd="config.yaml" desc="Configuracao central (agentes, prioridades, SP, colunas)" />
                <CommandRow cmd="sprints/current.md" desc="Sprint ativa — symlink para o arquivo da sprint atual" />
                <CommandRow cmd="logs/activity.jsonl" desc="Log unificado de todas as acoes dos agentes" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Convencoes de nomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <CommandRow cmd="TASK-NNNN.md" desc="Arquivo de task (ex: TASK-0042.md)" />
                <CommandRow cmd="sprint-NNN.md" desc="Arquivo de sprint (ex: sprint-012.md)" />
                <CommandRow cmd="YYYY-QN.md" desc="Arquivo de OKR (ex: 2026-Q1.md)" />
                <CommandRow cmd="task/TASK-NNNN" desc="Branch de implementacao (ex: task/TASK-0042)" />
                <CommandRow cmd="projects/<proj>/subprojects/<sub>/README.md" desc="Definicao de subprojeto (campos: id, parent, name, repo, status)" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
