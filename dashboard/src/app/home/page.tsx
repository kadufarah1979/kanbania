"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentStatusBar } from "@/components/agents/agent-status-bar";
import { ProjectSummaryCard } from "@/components/projects/project-summary-card";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";
import type { WSMessage, BoardColumn, OKR, Sprint } from "@/lib/types";

interface ProjectStat {
  tasks: Record<BoardColumn, number>;
  totalPoints: number;
  completedPoints: number;
  okrs: Pick<OKR, "id" | "objective" | "status" | "period" | "key_results">[];
  sprints: Pick<Sprint, "id" | "title" | "status" | "start_date" | "end_date" | "capacity">[];
}

type ProjectStats = Record<string, ProjectStat>;

export default function HomePage() {
  const { data: projects, loading, refetch: refetchProjects } = useProjects();
  const [stats, setStats] = useState<ProjectStats>({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/stats?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type !== "file-change") return;
      if (msg.area === "board" || msg.area === "projects") {
        refetchProjects();
        fetchStats();
      }
    },
    [refetchProjects, fetchStats]
  );

  useWebSocket(handleWsMessage);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentStatusBar />
      <h1 className="text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Projects</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              No projects found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectSummaryCard
              key={project.id}
              project={project}
              taskCounts={stats[project.id]?.tasks}
              totalPoints={stats[project.id]?.totalPoints}
              completedPoints={stats[project.id]?.completedPoints}
              okrs={stats[project.id]?.okrs}
              sprints={stats[project.id]?.sprints}
            />
          ))}
        </div>
      )}
    </div>
  );
}
