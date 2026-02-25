"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Calendar, X, Layers } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter, ZAxis,
} from "recharts";

interface BenchmarkData {
  costSummary: {
    totalCostUsd: number; costPerPoint: number; costPerTask: number;
    costPerHour: number; totalHours: number; doneTasks: number;
  };
  costByAgent: {
    agent: string; totalTokens: number; costUsd: number; tasksCompleted: number;
    totalPoints: number; costPerPoint: number; costPerTask: number; costPerHour: number;
    tokensPerPoint: number; tokensPerTask: number; totalHours: number;
  }[];
  costByProject: {
    project: string; totalTokens: number; costUsd: number; totalPoints: number;
    costPerPoint: number; taskCount: number; reworkRate: number; tokensPerPoint: number;
  }[];
  weeklyEfficiency: {
    week: string; tokens: number; points: number; tokensPerPoint: number; costUsd: number;
  }[];
  complexityCorrelation: {
    taskId: string; storyPoints: number; tokens: number; costUsd: number; agent: string; project: string;
  }[];
  quality: {
    reworkCostRatio: number; firstTimeRightRate: number; reviewTokensTotal: number; totalPhaseTokens: number;
  };
}

interface InsightsData {
  summary: {
    totalTokens: number;
    totalTasks: number;
    totalPoints: number;
    avgTokensPerPoint: number;
    avgTokensPerTask: number;
  };
  agentCosts: {
    agent: string; totalTokens: number; tasksCompleted: number;
    totalPoints: number; tokensPerPoint: number; avgTokensPerTask: number;
  }[];
  agentHours: {
    agent: string; totalHours: number; activeDays: number; sessions: number; avgSessionHours: number;
  }[];
  timeline: {
    date: string; tokens: number; taskCount: number; cumulativeTokens: number;
  }[];
  projectEfficiency: {
    project: string; totalTokens: number; totalPoints: number;
    tokensPerPoint: number; taskCount: number; reworkRate: number; avgReviewCycles: number;
  }[];
  benchmark: BenchmarkData;
}

import { AGENT_HEX_COLORS } from "@/lib/constants";
import { fmt } from "@/lib/format";

const AGENT_COLORS = AGENT_HEX_COLORS;

function fmtUsd(n: number): string {
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  if (n >= 1) return "$" + n.toFixed(2);
  if (n > 0) return "$" + n.toFixed(4);
  return "$0";
}

function movingAvg(data: { date: string; tokens: number }[], window: number) {
  return data.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = Math.round(slice.reduce((s, x) => s + x.tokens, 0) / slice.length);
    return { ...d, avg };
  });
}

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [project, setProject] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((list) => setProjects(list))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (project) params.set("project", project);
    const qs = params.toString();
    fetch(`/api/insights${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [from, to, project]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Carregando insights...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Erro ao carregar dados.</p>
      </div>
    );
  }

  const { summary, agentCosts, agentHours, timeline, projectEfficiency, benchmark } = data;
  const timelineWithAvg = movingAvg(timeline, 7);
  const { costSummary, costByAgent, costByProject, weeklyEfficiency, complexityCorrelation, quality } = benchmark;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights de Tokens</h1>
          <p className="text-muted-foreground">Analise de consumo de tokens por projeto, agente e tendencias.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground text-sm">ate</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {(from || to || project) && (
            <button
              onClick={() => { setFrom(""); setTo(""); setProject(""); }}
              className="h-9 px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary.totalTokens)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.totalTasks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Media/Task</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary.avgTokensPerTask)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Media/Point</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary.avgTokensPerPoint)}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projetos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="agentes">Agentes</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tokens/Point por Projeto</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={projectEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="project" />
                  <YAxis tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="tokensPerPoint" name="Tokens/Point" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectEfficiency.map((p) => (
              <Card
                key={p.project}
                className="hover:border-foreground/20 transition-colors cursor-pointer"
                onClick={() => router.push(`/insights/${p.project}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {p.project}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total tokens</span><span className="font-medium">{fmt(p.totalTokens)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tasks</span><span className="font-medium">{p.taskCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Points</span><span className="font-medium">{p.totalPoints}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tokens/point</span><span className="font-medium">{fmt(p.tokensPerPoint)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rework rate</span><span className="font-medium">{p.reworkRate}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Review cycles</span><span className="font-medium">{p.avgReviewCycles}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agentes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tokens por Agente</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={agentCosts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="agent" />
                  <YAxis tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="totalTokens" name="Total Tokens" fill="#a855f7" />
                  <Bar dataKey="tokensPerPoint" name="Tokens/Point" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {agentCosts.map((a) => {
              const hours = agentHours.find((h) => h.agent === a.agent);
              return (
                <Card key={a.agent}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: AGENT_COLORS[a.agent] || "#6b7280" }} />
                      {a.agent}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total tokens</span><span className="font-medium">{fmt(a.totalTokens)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tasks concluidas</span><span className="font-medium">{a.tasksCompleted}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total points</span><span className="font-medium">{a.totalPoints}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tokens/point</span><span className="font-medium">{fmt(a.tokensPerPoint)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Media/task</span><span className="font-medium">{fmt(a.avgTokensPerTask)}</span></div>
                    {hours && (
                      <>
                        <div className="border-t pt-1 mt-1" />
                        <div className="flex justify-between"><span className="text-muted-foreground">Horas trabalhadas</span><span className="font-medium">{hours.totalHours}h</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Dias ativos</span><span className="font-medium">{hours.activeDays}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Sessoes</span><span className="font-medium">{hours.sessions}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Media/sessao</span><span className="font-medium">{hours.avgSessionHours}h</span></div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Consumo Diario + Media Movel 7 dias</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={timelineWithAvg}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="tokens" name="Tokens/dia" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Line type="monotone" dataKey="avg" name="Media 7d" stroke="#f97316" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Consumo Acumulado</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="cumulativeTokens" name="Acumulado" stroke="#a855f7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          {/* Cost summary cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtUsd(costSummary.totalCostUsd)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Custo/Point</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtUsd(costSummary.costPerPoint)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Custo/Task</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtUsd(costSummary.costPerTask)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Custo/Hora</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtUsd(costSummary.costPerHour)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">First-Time-Right</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{quality.firstTimeRightRate}%</p></CardContent>
            </Card>
          </div>

          {/* Quality metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Metricas de Qualidade</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">First-time-right rate</span>
                    <span className="font-medium">{quality.firstTimeRightRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${quality.firstTimeRightRate}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo de retrabalho (tokens em review)</span>
                    <span className="font-medium">{quality.reworkCostRatio}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${quality.reworkCostRatio}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Tokens em review</span>
                  <span className="font-medium">{fmt(quality.reviewTokensTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens total (com fase)</span>
                  <span className="font-medium">{fmt(quality.totalPhaseTokens)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Custo por Projeto (USD)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={costByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => fmtUsd(Number(v))} />
                    <YAxis type="category" dataKey="project" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => fmtUsd(Number(v))} />
                    <Bar dataKey="costUsd" name="Custo USD" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Agent scorecard */}
          <Card>
            <CardHeader><CardTitle>Scorecard por Agente</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">Agente</th>
                      <th className="text-right py-2 px-3">Custo USD</th>
                      <th className="text-right py-2 px-3">$/Point</th>
                      <th className="text-right py-2 px-3">$/Task</th>
                      <th className="text-right py-2 px-3">$/Hora</th>
                      <th className="text-right py-2 px-3">Tokens/Point</th>
                      <th className="text-right py-2 px-3">Tasks</th>
                      <th className="text-right py-2 px-3">Points</th>
                      <th className="text-right py-2 px-3">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costByAgent.map((a) => (
                      <tr key={a.agent} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 pr-4">
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: AGENT_COLORS[a.agent] || "#6b7280" }} />
                            {a.agent}
                          </span>
                        </td>
                        <td className="text-right py-2 px-3 font-medium">{fmtUsd(a.costUsd)}</td>
                        <td className="text-right py-2 px-3">{fmtUsd(a.costPerPoint)}</td>
                        <td className="text-right py-2 px-3">{fmtUsd(a.costPerTask)}</td>
                        <td className="text-right py-2 px-3">{fmtUsd(a.costPerHour)}</td>
                        <td className="text-right py-2 px-3">{fmt(a.tokensPerPoint)}</td>
                        <td className="text-right py-2 px-3">{a.tasksCompleted}</td>
                        <td className="text-right py-2 px-3">{a.totalPoints}</td>
                        <td className="text-right py-2 px-3">{a.totalHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Complexity vs Cost scatter + Weekly efficiency */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Complexidade vs Custo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" dataKey="storyPoints" name="Story Points" label={{ value: "Story Points", position: "insideBottom", offset: -5, style: { fontSize: 11 } }} />
                    <YAxis type="number" dataKey="costUsd" name="Custo USD" tickFormatter={(v) => fmtUsd(Number(v))} />
                    <ZAxis type="number" dataKey="tokens" range={[40, 400]} name="Tokens" />
                    <Tooltip
                      formatter={(v, name) => {
                        if (name === "Custo USD") return fmtUsd(Number(v));
                        if (name === "Tokens") return fmt(Number(v));
                        return v;
                      }}
                      labelFormatter={() => ""}
                    />
                    <Legend />
                    {Object.entries(AGENT_COLORS).map(([agent, color]) => {
                      const agentData = complexityCorrelation.filter((d) => d.agent === agent);
                      return agentData.length > 0 ? (
                        <Scatter key={agent} name={agent} data={agentData} fill={color} />
                      ) : null;
                    })}
                    {(() => {
                      const knownAgents = Object.keys(AGENT_COLORS);
                      const otherData = complexityCorrelation.filter((d) => !knownAgents.includes(d.agent));
                      return otherData.length > 0 ? <Scatter name="outros" data={otherData} fill="#6b7280" /> : null;
                    })()}
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Eficiencia Semanal (Tokens/Point)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={weeklyEfficiency.filter((w) => w.tokensPerPoint > 0)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={fmt} />
                    <Tooltip
                      formatter={(v, name) => {
                        if (name === "Custo/sem") return fmtUsd(Number(v));
                        return fmt(Number(v));
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="tokensPerPoint" name="Tokens/Point" stroke="#a855f7" strokeWidth={2} />
                    <Line type="monotone" dataKey="costUsd" name="Custo/sem" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost per project table */}
          <Card>
            <CardHeader><CardTitle>Comparativo por Projeto</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">Projeto</th>
                      <th className="text-right py-2 px-3">Custo USD</th>
                      <th className="text-right py-2 px-3">$/Point</th>
                      <th className="text-right py-2 px-3">Tasks</th>
                      <th className="text-right py-2 px-3">Points</th>
                      <th className="text-right py-2 px-3">Tokens/Point</th>
                      <th className="text-right py-2 px-3">Rework</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costByProject.map((p) => (
                      <tr key={p.project} className="border-b border-border/50 hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/insights/${p.project}`)}>
                        <td className="py-2 pr-4 font-medium">{p.project}</td>
                        <td className="text-right py-2 px-3 font-medium">{fmtUsd(p.costUsd)}</td>
                        <td className="text-right py-2 px-3">{fmtUsd(p.costPerPoint)}</td>
                        <td className="text-right py-2 px-3">{p.taskCount}</td>
                        <td className="text-right py-2 px-3">{p.totalPoints}</td>
                        <td className="text-right py-2 px-3">{fmt(p.tokensPerPoint)}</td>
                        <td className="text-right py-2 px-3">{p.reworkRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
