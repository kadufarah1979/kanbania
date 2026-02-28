"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Terminal, GitBranch, Server, FolderTree,
  Play, Square, Eye, ArrowRight, Shield, Bot, Layers, PackageOpen,
  Plug, ListOrdered, Settings2, FileText, ScrollText,
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

      <Tabs defaultValue="install" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="install" className="gap-1.5">
            <PackageOpen className="h-4 w-4" /> Instalacao
          </TabsTrigger>
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
          <TabsTrigger value="releases" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Release Notes
          </TabsTrigger>
          <TabsTrigger value="mcp" className="gap-1.5">
            <Plug className="h-4 w-4" /> MCP Servers
          </TabsTrigger>
        </TabsList>

        {/* Instalacao */}
        <TabsContent value="install" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="h-5 w-5" /> npx create-kanbania
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A forma mais rapida de criar um novo workspace Kanbania com dashboard e servicos systemd configurados automaticamente.
              </p>
              <CommandRow cmd="npx create-kanbania meu-projeto" desc="Wizard interativo: define owner, timezone e agentes, instala tudo" />
              <CommandRow cmd="npx create-kanbania meu-projeto --yes" desc="Modo nao-interativo com valores padrao (ideal para CI)" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que o wizard instala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">O wizard pergunta nome do owner, timezone e agentes, e entao:</p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Cria a estrutura de diretorios: <code className="bg-muted px-1 rounded">board/</code>, <code className="bg-muted px-1 rounded">sprints/</code>, <code className="bg-muted px-1 rounded">okrs/</code>, <code className="bg-muted px-1 rounded">logs/</code>, <code className="bg-muted px-1 rounded">projects/</code></li>
                <li>Gera <code className="bg-muted px-1 rounded">config.yaml</code> preenchido com os dados informados</li>
                <li>Copia <code className="bg-muted px-1 rounded">AGENTS.md</code>, <code className="bg-muted px-1 rounded">CLAUDE.md</code> e <code className="bg-muted px-1 rounded">CODEX.md</code></li>
                <li>Clona o repositorio do dashboard, faz build standalone</li>
                <li>Cria os servicos systemd: <code className="bg-muted px-1 rounded">kb-dashboard</code> e <code className="bg-muted px-1 rounded">kb-dashboard-ws</code></li>
                <li>Inicializa repositorio git</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <CommandRow cmd="Node.js >= 18" desc="Necessario para o npx e o dashboard" />
                <CommandRow cmd="git >= 2.20" desc="Controle de versao do board" />
                <CommandRow cmd="systemd (Linux)" desc="Para os servicos kb-dashboard e kb-dashboard-ws" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apos a instalacao</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Entre no diretorio criado: <code className="bg-muted px-1 rounded">cd meu-projeto</code></li>
                <li>Inicie os servicos: <code className="bg-muted px-1 rounded">systemctl --user start kb-dashboard kb-dashboard-ws</code></li>
                <li>Acesse o dashboard em <code className="bg-muted px-1 rounded">http://localhost:8765</code></li>
                <li>Configure seus agentes em <code className="bg-muted px-1 rounded">config.yaml</code> e registre como servicos systemd</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

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
                <Server className="h-5 w-5" /> Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O dashboard roda em dois servicos: <Badge variant="outline">kb-dashboard</Badge> (Next.js, porta 8765) e <Badge variant="outline">kb-dashboard-ws</Badge> (WebSocket, porta 8766).
              </p>
              <CommandRow cmd="systemctl --user start kb-dashboard kb-dashboard-ws" desc="Inicia o dashboard e o WebSocket server" />
              <CommandRow cmd="systemctl --user stop kb-dashboard kb-dashboard-ws" desc="Para o dashboard e o WebSocket server" />
              <CommandRow cmd="systemctl --user restart kb-dashboard" desc="Reinicia o dashboard (ex: apos rebuild)" />
              <CommandRow cmd="systemctl --user status kb-dashboard" desc="Verifica status do dashboard" />
              <CommandRow cmd="journalctl --user -u kb-dashboard -f" desc="Acompanha logs do dashboard em tempo real" />
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
              <CommandRow cmd="journalctl --user -u kb-dashboard-ws -f" desc="Acompanha logs do WebSocket server em tempo real" />
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
              <CardTitle>Servicos do dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O dashboard roda em dois servicos systemd do usuario. Os arquivos de unit ficam em <code className="bg-muted px-1 rounded">~/.config/systemd/user/</code>.
              </p>
              <CommandRow cmd="systemctl --user status kb-dashboard" desc="Status do dashboard Next.js (porta 8765)" />
              <CommandRow cmd="systemctl --user status kb-dashboard-ws" desc="Status do WebSocket server (porta 8766)" />
              <CommandRow cmd="systemctl --user start kb-dashboard kb-dashboard-ws" desc="Inicia ambos os servicos do dashboard" />
              <CommandRow cmd="systemctl --user stop kb-dashboard kb-dashboard-ws" desc="Para ambos os servicos do dashboard" />
              <CommandRow cmd="systemctl --user restart kb-dashboard" desc="Reinicia o dashboard (ex: apos rebuild)" />
              <CommandRow cmd="systemctl --user enable kb-dashboard kb-dashboard-ws" desc="Habilita auto-start no login do usuario" />
              <CommandRow cmd="journalctl --user -u kb-dashboard -f" desc="Logs do dashboard em tempo real" />
              <CommandRow cmd="journalctl --user -u kb-dashboard-ws -f" desc="Logs do WebSocket server em tempo real" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servicos dos agentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Os agentes rodam como servicos systemd do usuario. Os arquivos de unit ficam em <code className="bg-muted px-1 rounded">~/.config/systemd/user/</code>.
              </p>
              <CommandRow cmd="systemctl --user status kb-claude-code" desc="Status do servico claude-code" />
              <CommandRow cmd="systemctl --user status kb-codex" desc="Status do servico codex" />
              <CommandRow cmd="systemctl --user restart kb-claude-code" desc="Reinicia claude-code" />
              <CommandRow cmd="journalctl --user -u kb-claude-code -f" desc="Logs do claude-code em tempo real" />
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
                <li>Dashboard nao abre: verificar <code className="bg-muted px-1 rounded">journalctl --user -u kb-dashboard</code> e confirmar porta 8765 livre.</li>
                <li>Sem atualizacoes em tempo real: verificar <code className="bg-muted px-1 rounded">journalctl --user -u kb-dashboard-ws</code> e confirmar porta 8766 livre.</li>
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
        {/* MCP Servers */}
        <TabsContent value="mcp" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" /> infra-analyzer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                MCP Server para automacao do fluxo completo de analise de infraestrutura AWS: inventario de recursos, coleta de metricas CloudWatch, diagnostico remoto via SSM, deteccao de anomalias e geracao de relatorio PDF. Integrado ao kanbania — cria tasks, move cards e registra activity.jsonl automaticamente.
              </p>
              <div className="space-y-1">
                <CommandRow cmd="python3 kanbania-fresh/mcp/server.py" desc="Inicia o servidor MCP manualmente (teste)" />
                <CommandRow cmd="pip install mcp pyyaml boto3 weasyprint" desc="Instala dependencias do servidor" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuracao no Claude Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Adicionar ao <code className="bg-muted px-1 rounded">~/.claude.json</code> na chave <code className="bg-muted px-1 rounded">mcpServers</code>:
              </p>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`{
  "mcpServers": {
    "infra-analyzer": {
      "command": "python3",
      "args": ["/caminho/para/kanbania/mcp/server.py"],
      "env": {
        "KANBANIA_PATH": "/caminho/para/kanbania"
      }
    }
  }
}`}
              </pre>
              <p className="text-sm text-muted-foreground">
                Apos adicionar, reiniciar a sessao do Claude Code para as tools ficarem disponiveis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" /> Fluxo de execucao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As tools sao executadas em sequencia. Cada uma reclama e conclui automaticamente a task correspondente no kanbania.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">start_infra_analysis</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">aws_inventory</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">cloudwatch_metrics</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">ssm_diagnose</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary">analyze_and_report</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline">generate_pdf_report</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>start_infra_analysis:</strong> Configura a sprint (ativa ou nova) e cria 5 tasks encadeadas no kanbania com <code className="bg-muted px-1 rounded">depends_on</code>. Retorna <code className="bg-muted px-1 rounded">task_ids</code> e <code className="bg-muted px-1 rounded">docs_dir</code>.</p>
                <p><strong>aws_inventory:</strong> Lista EC2, ALB/NLB, EBS e RDS. Compara com Terraform se <code className="bg-muted px-1 rounded">repo_path</code> fornecido. Salva <code className="bg-muted px-1 rounded">inventario.md</code>.</p>
                <p><strong>cloudwatch_metrics:</strong> Coleta metricas dos ultimos 14 dias (CPU, latencia, queue, erros). Salva <code className="bg-muted px-1 rounded">metricas-cloudwatch.md</code>.</p>
                <p><strong>ssm_diagnose:</strong> Executa comandos remotos via SSM: sistema, MongoDB (wiredtiger, colecoes) e Docker. Salva <code className="bg-muted px-1 rounded">diagnostico-ssm.md</code>.</p>
                <p><strong>analyze_and_report:</strong> Detecta anomalias via <code className="bg-muted px-1 rounded">thresholds.yaml</code>, rankeia por severidade e salva <code className="bg-muted px-1 rounded">analise-consolidada.md</code>.</p>
                <p><strong>generate_pdf_report:</strong> Gera o PDF final com todas as fases usando o template padrao INNOVAQ.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exemplo de uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Invocar no Claude Code:</p>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`start_infra_analysis(
  project="meu-projeto",
  aws_profile="MEU-PROFILE",
  region="us-east-1",
  environment="prd",
  use_active_sprint=True,
)

# Retorna: sprint_id, task_ids, docs_dir, next_step
# PDFs gerados em: kanbania/projects/<project>/docs/analise-<env>-<date>/
# Em seguida, executar cada tool na ordem com os IDs retornados`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" /> Integracao com kanbania
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Cada tool cria, reclama e conclui sua task automaticamente:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>5 tasks criadas no <code className="bg-muted px-1 rounded">backlog/</code> com <code className="bg-muted px-1 rounded">depends_on</code> encadeados (N+1 bloqueia N+0, etc.).</li>
                <li>Ao iniciar: task movida para <code className="bg-muted px-1 rounded">in-progress/</code> com <code className="bg-muted px-1 rounded">assigned_to: claude-code</code>.</li>
                <li>Ao concluir: task movida para <code className="bg-muted px-1 rounded">done/</code> (auto-approve — 1-2 SP, labels docs/infra).</li>
                <li>Cada operacao registrada em <code className="bg-muted px-1 rounded">logs/activity.jsonl</code>.</li>
                <li>Projeto e sprint respeitam as regras de <code className="bg-muted px-1 rounded">resolve_board()</code> do AGENTS.md.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" /> Thresholds de alerta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Configurar em <code className="bg-muted px-1 rounded">mcp/config/thresholds.yaml</code>:
              </p>
              <div className="space-y-1">
                <CommandRow cmd="ec2.cpu_avg_warning: 50" desc="% CPU media para warning (EC2)" />
                <CommandRow cmd="ec2.cpu_avg_critical: 70" desc="% CPU media para critico (EC2)" />
                <CommandRow cmd="ec2.credit_balance_min: 50" desc="Creditos minimos para instancias T-series" />
                <CommandRow cmd="alb.response_time_critical_s: 5.0" desc="Latencia critica no ALB (segundos)" />
                <CommandRow cmd="alb.error_5xx_critical: 100" desc="Erros 5XX/h para critico (ALB)" />
                <CommandRow cmd="ebs.queue_length_critical: 1.0" desc="Queue length critica no volume EBS" />
                <CommandRow cmd="mongodb.working_set_cache_ratio_critical: 0.95" desc="Ratio working set / wiredtiger cache para critico" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Arquivos gerados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Todos os arquivos sao salvos em <code className="bg-muted px-1 rounded">docs/analise-&#123;env&#125;-&#123;data&#125;/</code> dentro do repositorio do projeto:
              </p>
              <div className="space-y-1">
                <CommandRow cmd="inventario.md" desc="Recursos EC2, ALB/NLB, EBS, RDS e comparativo Terraform" />
                <CommandRow cmd="metricas-cloudwatch.md" desc="Metricas dos ultimos 14 dias por recurso" />
                <CommandRow cmd="diagnostico-ssm.md" desc="Saida dos comandos remotos (sistema, MongoDB, Docker)" />
                <CommandRow cmd="analise-consolidada.md" desc="Anomalias por severidade, recomendacoes, proximos passos" />
                <CommandRow cmd="relatorio-completo.pdf" desc="PDF final com capa, todas as fases e separadores visuais" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estrutura do servidor</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre">
{`kanbania-fresh/mcp/
├── server.py               # Entry point FastMCP (6 tools)
├── requirements.txt        # mcp, boto3, pyyaml, weasyprint
├── tools/
│   ├── kanban.py           # Criar tasks, mover cards, activity.jsonl
│   ├── aws_inventory.py    # EC2, ALB, EBS, RDS via boto3
│   ├── cloudwatch.py       # Metricas CloudWatch
│   ├── ssm.py              # Comandos via SSM Session Manager
│   ├── analyzer.py         # Deteccao de anomalias por thresholds
│   ├── report_builder.py   # Labels e listagem de arquivos por fase
│   └── pdf_generator.py    # Wrapper do pdf_report.py
└── config/
    ├── thresholds.yaml     # Limites de alerta configuráveis
    └── report_structure.yaml`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="releases" className="space-y-4 mt-4">
          {/* Sprint 091 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sprint 091 — Observabilidade de Agentes</CardTitle>
                <Badge variant="outline" className="text-xs">2026-02-28</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-500 mb-1">Novidades</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li><strong>AgentSwimLane</strong>: painel de swim lanes por agente no board, mostrando ferramentas em uso em tempo real</li>
                  <li><strong>EventChip</strong>: chips compactos com ícone, ferramenta e timestamp relativo; cor por tipo de hook</li>
                  <li><strong>Hook Events via WebSocket</strong>: <code className="bg-muted px-1 rounded">POST /events/hook</code> persiste eventos em JSONL e faz broadcast WS</li>
                  <li><strong>useHookEvents()</strong>: hook React para subscrever eventos de agentes filtrando por <code className="bg-muted px-1 rounded">agent_id</code></li>
                  <li><strong>WSMessage discriminated union</strong>: tipos <code className="bg-muted px-1 rounded">file-change</code>, <code className="bg-muted px-1 rounded">hook-event</code>, <code className="bg-muted px-1 rounded">hitl-request</code>, <code className="bg-muted px-1 rounded">hitl-resolved</code></li>
                  <li><strong>Mini-router server.ts</strong>: <code className="bg-muted px-1 rounded">handleRequest()</code> substitui bloco if/else; suporte a <code className="bg-muted px-1 rounded">/events/hook</code></li>
                  <li><strong>Log rotation</strong>: <code className="bg-muted px-1 rounded">hooks.jsonl</code> rotacionado automaticamente quando ultrapassa 5 MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sprint 044 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sprint 044 — Dashboard Config-Driven</CardTitle>
                <Badge variant="outline" className="text-xs">2026-02-28</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-500 mb-1">Novidades</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li><strong>BoardData dinâmico</strong>: tipo <code className="bg-muted px-1 rounded">Record&lt;string, Task[]&gt;</code> — colunas lidas do <code className="bg-muted px-1 rounded">config.yaml</code>, zero hardcoded</li>
                  <li><strong>reader.ts</strong>: inicialização do board e byStatus agora dinâmicos</li>
                  <li><strong>kanban-board.tsx</strong>: <code className="bg-muted px-1 rounded">filteredData</code> construído a partir de <code className="bg-muted px-1 rounded">displayColumns</code> do config</li>
                  <li><strong>api/projects/stats</strong>: contagem de tasks por status totalmente dinâmica</li>
                  <li><strong>server.ts build</strong> (TASK-0651): <code className="bg-muted px-1 rounded">npm run build</code> compila <code className="bg-muted px-1 rounded">server.ts → dist/server.js</code> via esbuild — sem dependência do tsx em produção</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sprint 039-043 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sprints 039–043 — Config Foundation & Scripts</CardTitle>
                <Badge variant="outline" className="text-xs">2026-02-21 → 2026-02-28</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-500 mb-1">Novidades</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li><strong>scripts/lib/config.sh</strong>: biblioteca central — <code className="bg-muted px-1 rounded">cfg()</code>, <code className="bg-muted px-1 rounded">get_columns()</code>, <code className="bg-muted px-1 rounded">get_reviewers()</code>, <code className="bg-muted px-1 rounded">resolve_board()</code>, <code className="bg-muted px-1 rounded">notify()</code></li>
                  <li><strong>config.yaml</strong>: expandido com seções <code className="bg-muted px-1 rounded">system</code>, <code className="bg-muted px-1 rounded">workflow</code>, <code className="bg-muted px-1 rounded">agents</code>, <code className="bg-muted px-1 rounded">projects</code>, <code className="bg-muted px-1 rounded">git</code>, <code className="bg-muted px-1 rounded">notifications</code></li>
                  <li><strong>Todos os scripts migrados</strong>: <code className="bg-muted px-1 rounded">kb.sh</code>, <code className="bg-muted px-1 rounded">board-monitor.sh</code>, <code className="bg-muted px-1 rounded">kanban-lint.sh</code>, <code className="bg-muted px-1 rounded">update-agent-status.sh</code>, <code className="bg-muted px-1 rounded">agent-heartbeat.sh</code> — todos config-driven via <code className="bg-muted px-1 rounded">$KANBAN_ROOT</code></li>
                  <li><strong>Scripts renomeados</strong>: <code className="bg-muted px-1 rounded">trigger-agent-review/fix/next.sh</code>, <code className="bg-muted px-1 rounded">sync-agent-worktree.sh</code> (sem &quot;codex&quot; no nome)</li>
                  <li><strong>test-config.sh</strong>: 23 testes unitários do config.sh</li>
                  <li><strong>Dashboard</strong>: <code className="bg-muted px-1 rounded">config-reader.ts</code>, <code className="bg-muted px-1 rounded">useConfig()</code>, <code className="bg-muted px-1 rounded">GET /api/config</code>, <code className="bg-muted px-1 rounded">constants.ts</code> com KANBAN_ROOT dinâmico</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sprint 045-047 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sprints 045–047 — Open Source Ready</CardTitle>
                <Badge variant="outline" className="text-xs">2026-02-21 → 2026-02-28</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-500 mb-1">Novidades</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li><strong>AGENTS.md genericizado</strong>: em inglês, role-based (sem agent IDs hardcoded), referencia config.yaml</li>
                  <li><strong>Templates de agentes</strong>: <code className="bg-muted px-1 rounded">templates/agents/en/</code> e <code className="bg-muted px-1 rounded">pt-BR/</code> — implementer, reviewer, both, pm</li>
                  <li><strong>setup.sh</strong>: wizard interativo com modos <code className="bg-muted px-1 rounded">--quick</code>, <code className="bg-muted px-1 rounded">--detailed</code>, <code className="bg-muted px-1 rounded">--from-config</code>, <code className="bg-muted px-1 rounded">--upgrade</code></li>
                  <li><strong>npx create-kanbania</strong>: instalador interativo completo</li>
                  <li><strong>LICENSE</strong> (MIT), <strong>CONTRIBUTING.md</strong>, <strong>CODE_OF_CONDUCT.md</strong></li>
                  <li><strong>.github/</strong>: issue templates (bug, feature) e PR template</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
