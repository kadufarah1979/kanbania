"use client";

import { useState } from "react";
import type { Stats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_COLORS, COLUMN_HEADER_COLOR, agentColorStyle } from "@/lib/constants";
import { useConfig } from "@/lib/hooks/use-config";
import { cn } from "@/lib/utils";
import { BarChart3, CheckCircle, Clock, Layers, ChevronDown, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "A Fazer",
  "in-progress": "Em Progresso",
  review: "Revisao",
  done: "Concluido",
  archived: "Finalizadas",
};

interface StatsOverviewProps {
  stats: Stats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const [open, setOpen] = useState(false);
  const { config } = useConfig();
  const agentHexColors = Object.fromEntries(
    (config?.agents ?? []).map((a) => [a.id, a.color])
  );

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Estatísticas
        <span className="text-xs font-normal">
          ({stats.totalTasks} tasks · {stats.byStatus.done} concluidas · {stats.byStatus["in-progress"]} em progresso)
        </span>
      </button>

      {!open ? null : <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total de Tasks"
          value={stats.totalTasks}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          title="Concluidas"
          value={stats.byStatus.done}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          title="Em Progresso"
          value={stats.byStatus["in-progress"]}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
        />
        <StatCard
          title="Pontos"
          value={`${stats.completedPoints}/${stats.totalPoints}`}
          icon={<Layers className="h-4 w-4" />}
          subtitle="concluidos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(stats.byStatus) as [string, number][]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className={cn("capitalize", COLUMN_HEADER_COLOR[status as keyof typeof COLUMN_HEADER_COLOR] || "")}>{STATUS_LABELS[status] || status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-muted w-24">
                    <div
                      className={cn("h-2 rounded-full", getStatusBarColor(status))}
                      style={{ width: `${stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(stats.byPriority) as [string, number][]).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]?.dot || "")} />
                  <span className="capitalize">{priority}</span>
                </span>
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byAgent).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma task atribuida</p>
            ) : (
              Object.entries(stats.byAgent).map(([agent, count]) => (
                <div key={agent} className="flex items-center justify-between text-sm">
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium border" style={agentColorStyle(agentHexColors[agent])}>{agent}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      </>}
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string; value: string | number; icon: React.ReactNode; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className="mt-1">
          <span className="text-2xl font-bold">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground ml-1">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBarColor(status: string): string {
  const colors: Record<string, string> = {
    backlog: "bg-gray-500",
    todo: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    review: "bg-orange-500",
    done: "bg-green-500",
    archived: "bg-emerald-600",
  };
  return colors[status] || "bg-gray-500";
}
