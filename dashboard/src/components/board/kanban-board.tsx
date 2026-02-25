"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { Task, BoardData, BoardColumn as BoardColumnType, WSMessage } from "@/lib/types";
import { BOARD_COLUMNS } from "@/lib/constants";
import { KanbanColumn } from "./kanban-column";
import { TaskDialog } from "./task-dialog";
import { BoardFilters } from "./board-filters";
import { useBoard } from "@/lib/hooks/use-board";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanBoardProps {
  onWsStatus: (connected: boolean) => void;
}

export function KanbanBoard({ onWsStatus }: KanbanBoardProps) {
  const { data, loading, refetch } = useBoard();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ project: "", priority: "", agent: "", label: "" });

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "board") refetch();
    },
    [refetch]
  );

  const { connected } = useWebSocket(handleWsMessage);

  // Notify parent of WS status
  useEffect(() => {
    onWsStatus(connected);
  }, [connected, onWsStatus]);

  // Gather all tasks for filters
  const allTasks = useMemo(() => {
    return Object.values(data).flat();
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    const result: BoardData = { backlog: [], todo: [], "in-progress": [], review: [], done: [], archived: [] };
    for (const col of Object.keys(data) as BoardColumnType[]) {
      result[col] = data[col].filter((t) => {
        if (filters.project && t.project !== filters.project) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        if (filters.agent && t.assigned_to !== filters.agent) return false;
        if (filters.label && !t.labels.includes(filters.label)) return false;
        return true;
      });
    }
    return result;
  }, [data, filters]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-32" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BoardFilters tasks={allTasks} filters={filters} onChange={setFilters} />

      <div className="flex gap-4 overflow-x-auto pb-1">
        {BOARD_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            name={col.name}
            tasks={filteredData[col.id]}
            collapsed={col.id === "archived" || filteredData[col.id].length === 0}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>

      <TaskDialog
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
