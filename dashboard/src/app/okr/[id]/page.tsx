"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Target, Calendar, TrendingUp, CheckCircle2, Circle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { OKR, Sprint, WSMessage } from "@/lib/types";

interface SprintWithStats extends Sprint {
  taskCount: number;
  totalPoints: number;
  completedPoints: number;
  tasksByStatus: Record<string, number>;
  totalTokens: number;
}

interface OKRDetail {
  okr: OKR;
  sprints: SprintWithStats[];
  project: { id: string; name: string } | null;
}

const OKR_STATUS_STYLE: Record<string, string> = {
  active: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

import { SPRINT_STATUS_STYLE } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  backlog: "text-gray-400",
  todo: "text-blue-400",
  "in-progress": "text-yellow-400",
  review: "text-orange-400",
  done: "text-green-400",
  archived: "text-emerald-500",
};

function formatDateShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), "dd/MM");
  } catch {
    return dateStr;
  }
}

export default function OKRPage() {
  const params = useParams();
  const okrId = params.id as string;
  const [data, setData] = useState<OKRDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/okr/${okrId}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [okrId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type !== "file-change") return;
      if (msg.area === "board" || msg.area === "sprints" || msg.area === "okrs") {
        fetchData();
      }
    },
    [fetchData]
  );

  useWebSocket(handleWsMessage);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">OKR not found.</p>;
  }

  const { okr, sprints, project } = data;
  const krDone = okr.key_results?.filter((kr) => kr.current >= kr.target).length || 0;
  const krTotal = okr.key_results?.length || 0;
  const totalSprintPoints = sprints.reduce((s, sp) => s + sp.totalPoints, 0);
  const completedSprintPoints = sprints.reduce((s, sp) => s + sp.completedPoints, 0);
  const totalTasks = sprints.reduce((s, sp) => s + sp.taskCount, 0);
  const totalTokens = sprints.reduce((s, sp) => s + sp.totalTokens, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          {project && (
            <>
              <span className="text-muted-foreground">/</span>
              <Link
                href={`/board/${project.id}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {project.name}
              </Link>
            </>
          )}
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">{okr.id}</span>
        </div>

        {/* OKR Header */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Target className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold leading-tight">{okr.objective}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {okr.id}
                    {project && <span> &middot; {project.name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cn("text-xs", OKR_STATUS_STYLE[okr.status] || "")}>
                  {okr.period}
                </Badge>
                <Badge variant="outline" className={cn("text-xs capitalize", OKR_STATUS_STYLE[okr.status] || "")}>
                  {okr.status}
                </Badge>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                KR: {krDone}/{krTotal}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {sprints.length} sprints
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                {completedSprintPoints}/{totalSprintPoints} pts
              </span>
              <span>{totalTasks} tasks</span>
              {totalTokens > 0 && (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  {totalTokens.toLocaleString()} tokens
                </span>
              )}
            </div>

            {/* Points progress bar */}
            {totalSprintPoints > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(completedSprintPoints / totalSprintPoints) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}%
                </span>
              </div>
            )}

            {/* Key Results */}
            {okr.key_results && okr.key_results.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <h3 className="text-sm font-semibold">Key Results</h3>
                {okr.key_results.map((kr) => {
                  const done = kr.current >= kr.target;
                  const pct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
                  return (
                    <div key={kr.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", done && "text-muted-foreground line-through")}>
                            {kr.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-48">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  done ? "bg-green-500" : "bg-amber-500"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sprints */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Sprints ({sprints.length})</h2>
          {sprints.map((sprint) => {
            const pct = sprint.totalPoints > 0
              ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100)
              : 0;

            return (
              <Link key={sprint.id} href={`/board/${sprint.project}?sprint=${sprint.id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <h3 className="text-sm font-semibold">{sprint.title}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs capitalize", SPRINT_STATUS_STYLE[sprint.status] || "")}
                      >
                        {sprint.status}
                      </Badge>
                    </div>

                    {sprint.goal && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{sprint.goal}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDateShort(sprint.start_date)} → {formatDateShort(sprint.end_date)}</span>
                      <span>{sprint.taskCount} tasks</span>
                      <span>{sprint.completedPoints}/{sprint.totalPoints} pts</span>
                      {sprint.totalPoints > 0 && (
                        <span className={cn(pct === 100 ? "text-green-400" : "text-muted-foreground")}>
                          {pct}%
                        </span>
                      )}
                      {sprint.totalTokens > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {sprint.totalTokens.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Task status breakdown */}
                    {sprint.taskCount > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          {["done", "review", "in-progress", "todo", "backlog"].map((status) =>
                            sprint.tasksByStatus[status] > 0 ? (
                              <div
                                key={status}
                                className={cn(
                                  "h-full",
                                  status === "done" && "bg-green-500",
                                  status === "review" && "bg-orange-500",
                                  status === "in-progress" && "bg-yellow-500",
                                  status === "todo" && "bg-blue-500",
                                  status === "backlog" && "bg-gray-500"
                                )}
                                style={{ width: `${(sprint.tasksByStatus[status] / sprint.taskCount) * 100}%` }}
                              />
                            ) : null
                          )}
                        </div>
                        <div className="flex gap-2">
                          {Object.entries(sprint.tasksByStatus).map(([status, count]) => (
                            <span key={status} className={cn("text-[10px]", STATUS_COLORS[status] || "text-gray-400")}>
                              {count} {status}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {sprints.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma sprint vinculada a este OKR.
            </p>
          )}
        </div>
    </div>
  );
}
