"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, TrendingUp, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { Sprint, WSMessage } from "@/lib/types";

interface TokensByPhase {
  backlog: number;
  todo: number;
  in_progress: number;
  review: number;
}

interface SprintWithStats extends Sprint {
  taskCount: number;
  totalPoints: number;
  completedPoints: number;
  tasksByStatus: Record<string, number>;
  totalTokens: number;
  tokensByPhase?: TokensByPhase;
}

interface SprintsData {
  project: { id: string; name: string } | null;
  sprints: SprintWithStats[];
}

type StatusFilter = "all" | "active" | "pending" | "planning" | "completed";

import { SPRINT_STATUS_STYLE } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-500",
  todo: "bg-blue-500",
  "in-progress": "bg-yellow-500",
  review: "bg-orange-500",
  done: "bg-green-500",
  archived: "bg-emerald-600",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
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

export default function SprintsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    }>
      <SprintsPage />
    </Suspense>
  );
}

function SprintsPage() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project");
  const [data, setData] = useState<SprintsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchData = useCallback(async () => {
    try {
      const url = projectFilter
        ? `/api/sprints?project=${projectFilter}&_t=${Date.now()}`
        : `/api/sprints?_t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "board" || msg.area === "sprints") {
        fetchData();
      }
    },
    [fetchData]
  );

  useWebSocket(handleWsMessage);

  const filtered = data?.sprints.filter((s) => {
    if (statusFilter === "all") return true;
    return s.status === statusFilter;
  }) || [];

  const statusCounts = data?.sprints.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const projectName = data?.project?.name || projectFilter || "Todas";
  const projectId = data?.project?.id || projectFilter;

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
          {projectId && (
            <>
              <span className="text-muted-foreground">/</span>
              <Link
                href={`/board/${projectId}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {projectName}
              </Link>
            </>
          )}
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">Sprints</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Sprints {projectName !== "Todas" && `— ${projectName}`}
          </h1>
          <span className="text-sm text-muted-foreground">
            {data?.sprints.length || 0} total
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "pending", "planning", "completed"] as StatusFilter[]).map((s) => {
            const count = s === "all" ? data?.sprints.length || 0 : statusCounts[s] || 0;
            if (s !== "all" && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border transition-colors capitalize",
                  statusFilter === s
                    ? "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                {s === "all" ? "Todas" : s} ({count})
              </button>
            );
          })}
        </div>

        {/* Sprint list */}
        <div className="space-y-3">
          {filtered.map((sprint) => {
            const pct = sprint.totalPoints > 0
              ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100)
              : 0;
            const isCompleted = sprint.status === "completed";

            return (
              <Link key={sprint.id} href={`/sprints/${sprint.id}`}>
                <Card className={cn(
                  "hover:border-foreground/20 transition-colors cursor-pointer",
                  isCompleted && "opacity-60"
                )}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <Calendar className="h-4 w-4 text-blue-400" />
                        )}
                        <h3 className={cn("text-sm font-semibold", isCompleted && "line-through")}>
                          {sprint.title}
                        </h3>
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
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {sprint.completedPoints}/{sprint.totalPoints} pts
                      </span>
                      {sprint.totalPoints > 0 && (
                        <span className={cn(pct === 100 ? "text-green-400" : "text-muted-foreground")}>
                          {pct}%
                        </span>
                      )}
                      {sprint.totalTokens > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {sprint.totalTokens.toLocaleString()} tokens
                          {sprint.tokensByPhase && (sprint.tokensByPhase.in_progress + sprint.tokensByPhase.review) > 0 && (() => {
                            const impl = sprint.tokensByPhase!.in_progress;
                            const rev = sprint.tokensByPhase!.review;
                            const sum = impl + rev;
                            if (sum === 0) return null;
                            const implPct = Math.round((impl / sum) * 100);
                            const revPct = 100 - implPct;
                            return (
                              <span className="text-[10px] ml-1">
                                (<span className="text-yellow-400">{implPct}% impl</span>{" / "}<span className="text-orange-400">{revPct}% review</span>)
                              </span>
                            );
                          })()}
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
                                className={cn("h-full", STATUS_COLORS[status] || "bg-gray-500")}
                                style={{ width: `${(sprint.tasksByStatus[status] / sprint.taskCount) * 100}%` }}
                              />
                            ) : null
                          )}
                        </div>
                        <div className="flex gap-2">
                          {Object.entries(sprint.tasksByStatus).map(([status, count]) => (
                            <span key={status} className={cn("text-[10px]", STATUS_TEXT_COLORS[status] || "text-gray-400")}>
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

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma sprint encontrada com este filtro.
            </p>
          )}
        </div>
    </div>
  );
}
