"use client";

import { useState, useEffect, useCallback } from "react";
import { KanbanBoard } from "@/components/board/kanban-board";
import { StatsOverview } from "@/components/stats/stats-overview";
import { AgentStatusBar } from "@/components/agents/agent-status-bar";
import { ProjectSummaryCard } from "@/components/projects/project-summary-card";
import { useStats } from "@/lib/hooks/use-stats";
import { useProjects } from "@/lib/hooks/use-projects";
import { useSprint } from "@/lib/hooks/use-sprint";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { SprintBanner } from "@/components/sprint/sprint-banner";
import type { WSMessage, BoardColumn, OKR, Sprint } from "@/lib/types";

interface ProjectStat {
  tasks: Record<BoardColumn, number>;
  totalPoints: number;
  completedPoints: number;
  okrs: Pick<OKR, "id" | "objective" | "status" | "period" | "key_results">[];
  sprints: Pick<Sprint, "id" | "title" | "status" | "start_date" | "end_date" | "capacity">[];
}

type ProjectStats = Record<string, ProjectStat>;

export default function BoardPage() {
  const { data: stats, refetch: refetchStats } = useStats();
  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: currentSprint, refetch: refetchSprint } = useSprint();
  const [projectStats, setProjectStats] = useState<ProjectStats>({});

  const fetchProjectStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/stats?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) setProjectStats(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProjectStats();
  }, [fetchProjectStats]);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "board" || msg.area === "projects" || msg.area === "sprints") {
        refetchStats();
        refetchProjects();
        refetchSprint();
        fetchProjectStats();
      }
    },
    [refetchStats, refetchProjects, refetchSprint, fetchProjectStats]
  );

  useWebSocket(handleWsMessage);

  return (
    <div className="space-y-6">
      {stats && <StatsOverview stats={stats} />}
      <AgentStatusBar />

        {/* Sprint ativa */}
        {currentSprint && <SprintBanner sprint={currentSprint} label="Sprint Ativa" />}

        {/* Projetos */}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Projetos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectSummaryCard
                  key={project.id}
                  project={project}
                  taskCounts={projectStats[project.id]?.tasks}
                  totalPoints={projectStats[project.id]?.totalPoints}
                  completedPoints={projectStats[project.id]?.completedPoints}
                  okrs={projectStats[project.id]?.okrs}
                  sprints={projectStats[project.id]?.sprints}
                />
              ))}
            </div>
          </div>
        )}

      <KanbanBoard onWsStatus={() => {}} />
    </div>
  );
}
