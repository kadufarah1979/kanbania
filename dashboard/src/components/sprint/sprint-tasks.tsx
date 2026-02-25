"use client";

import type { Task, BoardColumn } from "@/lib/types";
import { PRIORITY_COLORS, AGENT_COLORS, COLUMN_HEADER_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SprintTasksProps {
  tasks: Task[];
}

const statusOrder: BoardColumn[] = ["in-progress", "todo", "review", "done", "backlog"];

export function SprintTasks({ tasks }: SprintTasksProps) {
  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {} as Record<BoardColumn, Task[]>);

  return (
    <div className="space-y-4">
      {statusOrder.map((status) => {
        const items = grouped[status];
        if (!items || items.length === 0) return null;
        return (
          <div key={status}>
            <h4 className={cn("text-sm font-semibold mb-2 capitalize", COLUMN_HEADER_COLOR[status])}>
              {status} ({items.length})
            </h4>
            <div className="space-y-1.5">
              {items.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border bg-card p-2.5 border-l-4",
                    PRIORITY_COLORS[task.priority].border
                  )}
                >
                  <span className="text-xs font-mono text-muted-foreground w-20">{task.id}</span>
                  <span className="text-sm flex-1">{task.title}</span>
                  {task.story_points && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{task.story_points}pt</span>
                  )}
                  {task.assigned_to && (
                    <Badge variant="outline" className={cn("text-[10px]", AGENT_COLORS[task.assigned_to] || "")}>
                      {task.assigned_to}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
