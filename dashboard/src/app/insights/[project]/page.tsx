"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock, Target, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

interface KeyResult {
  id: string; description: string; target: number; current: number; unit: string;
}

interface OKRData {
  id: string; objective: string; period: string; status: string;
  key_results: KeyResult[]; taskCount: number; tasksDone: number; totalTokens: number;
}

interface ProjectInsightsData {
  project: string;
  summary: {
    totalTokens: number; totalTasks: number; totalPoints: number;
    doneTasks: number; avgTokensPerPoint: number; avgTokensPerTask: number;
  };
  sprintCosts: {
    sprintId: string; title: string; status: string;
    totalTokens: number; byPhase: { backlog: number; todo: number; in_progress: number; review: number };
    taskCount: number; points: number;
  }[];
  velocity: { sprintId: string; points: number; tokens: number; tasks: number }[];
  agentCosts: {
    agent: string; totalTokens: number; tasksCompleted: number;
    totalPoints: number; tokensPerPoint: number; avgTokensPerTask: number;
  }[];
  timeline: { date: string; tokens: number; taskCount: number; cumulativeTokens: number }[];
  tasksByStatus: Record<string, number>;
  topTasks: {
    id: string; title: string; status: string; sprint: string | null;
    tokens_used: number | null; story_points: number | null; assigned_to: string | null;
  }[];
  okrs: OKRData[];
}

import { AGENT_HEX_COLORS, STATUS_HEX_COLORS } from "@/lib/constants";
import { fmt, movingAvg } from "@/lib/format";

const PHASE_COLORS = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  in_progress: "#eab308",
  review: "#f97316",
};

const STATUS_COLORS = STATUS_HEX_COLORS;
const AGENT_COLORS = AGENT_HEX_COLORS;

function statusLabel(s: string) {
  const map: Record<string, string> = {
    backlog: "Backlog", todo: "To Do", "in-progress": "In Progress",
    review: "Review", done: "Done", archived: "Archived",
  };
  return map[s] || s;
}

function okrStatusIcon(status: string) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "active") return <Clock className="h-4 w-4 text-yellow-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

export default function ProjectInsightsPage() {
  const params = useParams();
  const projectSlug = params.project as string;
  const [data, setData] = useState<ProjectInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const q = qs.toString();
    fetch(`/api/insights/${projectSlug}${q ? `?${q}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectSlug, from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Carregando insights de {projectSlug}...</p>
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

  const { summary, sprintCosts, velocity, agentCosts, timeline, tasksByStatus, topTasks, okrs } = data;
  const timelineWithAvg = movingAvg(timeline, 7);

  const pieData = Object.entries(tasksByStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: statusLabel(k), value: v, color: STATUS_COLORS[k] || "#6b7280" }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/insights" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{projectSlug}</h1>
            <p className="text-muted-foreground">Insights detalhados do projeto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
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
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); }}
              className="h-9 px-2 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Limpar filtro"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary.totalTokens)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.totalTasks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Concluidas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-500">{summary.doneTasks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Points</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.totalPoints}</p></CardContent>
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

      <Tabs defaultValue="okrs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        {/* OKRs Tab */}
        <TabsContent value="okrs" className="space-y-4">
          {okrs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum OKR vinculado a tasks deste projeto.
              </CardContent>
            </Card>
          ) : (
            okrs.map((okr) => (
              <Card key={okr.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {okrStatusIcon(okr.status)}
                      <div>
                        <CardTitle className="text-base">{okr.objective}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {okr.id} &middot; {okr.period} &middot; {okr.tasksDone}/{okr.taskCount} tasks &middot; {fmt(okr.totalTokens)} tokens
                        </p>
                      </div>
                    </div>
                    <Badge variant={okr.status === "completed" ? "default" : "secondary"} className="capitalize shrink-0">
                      {okr.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {okr.key_results.map((kr) => {
                      const pct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
                      return (
                        <div key={kr.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{kr.description}</span>
                            </div>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Sprints Tab */}
        <TabsContent value="sprints" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tokens por Sprint (por fase)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sprintCosts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="sprintId" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="byPhase.backlog" name="Backlog" stackId="a" fill={PHASE_COLORS.backlog} />
                  <Bar dataKey="byPhase.todo" name="Todo" stackId="a" fill={PHASE_COLORS.todo} />
                  <Bar dataKey="byPhase.in_progress" name="In Progress" stackId="a" fill={PHASE_COLORS.in_progress} />
                  <Bar dataKey="byPhase.review" name="Review" stackId="a" fill={PHASE_COLORS.review} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {velocity.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Velocidade (Points por Sprint)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={velocity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="sprintId" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="points" name="Points" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="tasks" name="Tasks" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Resumo por Sprint</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Sprint</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4 text-right">Tokens</th>
                      <th className="pb-2 pr-4 text-right">Tasks</th>
                      <th className="pb-2 pr-4 text-right">Points</th>
                      <th className="pb-2 text-right">Tokens/Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintCosts.map((s) => (
                      <tr key={s.sprintId} className="border-b">
                        <td className="py-2 pr-4 font-medium">{s.sprintId}</td>
                        <td className="py-2 pr-4"><Badge variant="secondary" className="capitalize">{s.status}</Badge></td>
                        <td className="py-2 pr-4 text-right">{fmt(s.totalTokens)}</td>
                        <td className="py-2 pr-4 text-right">{s.taskCount}</td>
                        <td className="py-2 pr-4 text-right">{s.points}</td>
                        <td className="py-2 text-right">{s.points > 0 ? fmt(Math.round(s.totalTokens / s.points)) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribuicao por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tokens por Agente</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={agentCosts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={fmt} />
                    <YAxis type="category" dataKey="agent" width={100} />
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Bar dataKey="totalTokens" name="Tokens" fill="#a855f7">
                      {agentCosts.map((a, i) => (
                        <Cell key={i} fill={AGENT_COLORS[a.agent] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Top Tasks por Consumo de Tokens</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Task</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Sprint</th>
                      <th className="pb-2 pr-4">Agente</th>
                      <th className="pb-2 pr-4 text-right">Points</th>
                      <th className="pb-2 text-right">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTasks.map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="py-2 pr-4">
                          <div>
                            <span className="font-medium">{t.id}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{t.title}</p>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className="capitalize text-xs">{statusLabel(t.status)}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{t.sprint || "-"}</td>
                        <td className="py-2 pr-4">
                          {t.assigned_to && (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AGENT_COLORS[t.assigned_to] || "#6b7280" }} />
                              {t.assigned_to}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-right">{t.story_points || "-"}</td>
                        <td className="py-2 text-right font-medium">{fmt(t.tokens_used || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendencias Tab */}
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
      </Tabs>
    </div>
  );
}
