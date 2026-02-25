"use client";

import { useParams, useSearchParams, redirect } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";

const PROJECT_REDIRECTS: Record<string, string> = {
  mdm: "mdm-terraform",
};
import { AgentStatusBar } from "@/components/agents/agent-status-bar";
import { KanbanColumn } from "@/components/board/kanban-column";
import { TaskDialog } from "@/components/board/task-dialog";
import { useBoard } from "@/lib/hooks/use-board";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { useProjects } from "@/lib/hooks/use-projects";
import { Skeleton } from "@/components/ui/skeleton";
import { BOARD_COLUMNS } from "@/lib/constants";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SprintBanner } from "@/components/sprint/sprint-banner";
import type { Task, Sprint, BoardData, BoardColumn, WSMessage } from "@/lib/types";

interface SprintWithOkrs extends Sprint {
  linkedOkrs?: { id: string; objective: string }[];
}

export default function ProjectBoardPage() {
  const params = useParams();
  const rawSlug = params.project as string;
  const searchParams = useSearchParams();
  const sprintFilter = searchParams.get("sprint");
  const redirectTo = PROJECT_REDIRECTS[rawSlug];
  if (redirectTo) redirect(`/board/${redirectTo}`);
  const projectSlug = rawSlug;

  const { data, loading, refetch } = useBoard();
  const { data: projects } = useProjects();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sprintData, setSprintData] = useState<SprintWithOkrs | null>(null);
  const [projectSprintIds, setProjectSprintIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/sprints?project=${projectSlug}&_t=${Date.now()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sprints) {
          setProjectSprintIds(data.sprints.map((s: { id: string }) => s.id));
          // Se não há filtro de sprint na URL, exibe a sprint ativa do projeto
          if (!sprintFilter) {
            const active = data.sprints.find((s: { status: string }) => s.status === "active")
              ?? data.sprints[0]
              ?? null;
            setSprintData(active);
          }
        }
      })
      .catch(() => setProjectSprintIds([]));

    if (sprintFilter) {
      fetch(`/api/sprint/${sprintFilter}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setSprintData)
        .catch(() => setSprintData(null));
    }
  }, [sprintFilter, projectSlug]);

  const project = projects.find((p) => p.id === projectSlug);
  const projectName = project?.name || projectSlug;

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "board") refetch();
    },
    [refetch]
  );

  useWebSocket(handleWsMessage);

  const filteredData = useMemo(() => {
    const result: BoardData = { backlog: [], todo: [], "in-progress": [], review: [], done: [], archived: [] };
    for (const col of Object.keys(data) as BoardColumn[]) {
      result[col] = data[col].filter((t) => {
        if (t.project !== projectSlug) return false;
        if (sprintFilter && t.sprint !== sprintFilter) return false;
        return true;
      });
    }
    return result;
  }, [data, projectSlug, sprintFilter]);

  const totalTasks = useMemo(
    () => Object.values(filteredData).flat().length,
    [filteredData]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AgentStatusBar project={projectSlug} />
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold">{projectName}</h1>
          <span className="text-sm text-muted-foreground">
            ({totalTasks} tasks)
          </span>
          {sprintFilter && (
            <Link
              href={`/board/${projectSlug}`}
              className="flex items-center gap-1 ml-2"
            >
              <Badge variant="outline" className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1">
                {sprintFilter.replace("sprint-0", "Sprint ")}
                <X className="h-3 w-3" />
              </Badge>
            </Link>
          )}
        </div>

        {sprintData && <SprintBanner sprint={sprintData} label={sprintFilter ? undefined : "Sprint Ativa"} navigation={(() => {
          const sprintId = sprintFilter ?? sprintData?.id ?? null;
          const idx = sprintId ? projectSprintIds.indexOf(sprintId) : -1;
          if (idx < 0 || projectSprintIds.length === 0) return undefined;
          return {
            prevId: idx < projectSprintIds.length - 1 ? projectSprintIds[idx + 1] : null,
            nextId: idx > 0 ? projectSprintIds[idx - 1] : null,
            current: projectSprintIds.length - idx,
            total: projectSprintIds.length,
            projectSlug,
          };
        })()} />}

        <div className="flex gap-4 overflow-x-auto pb-1">
          {sprintData?.status === "completed" ? (
            /* Sprint completada: só mostra coluna Finalizadas expandida */
            <KanbanColumn
              key="archived"
              columnId="archived"
              name="Finalizadas"
              tasks={filteredData.archived}
              collapsed={false}
              onTaskClick={setSelectedTask}
            />
          ) : (
            BOARD_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                name={col.name}
                tasks={filteredData[col.id]}
                collapsed={col.id === "archived" || filteredData[col.id].length === 0}
                onTaskClick={setSelectedTask}
              />
            ))
          )}
        </div>

        <TaskDialog
          task={selectedTask}
          open={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
        />
    </div>
  );
}
