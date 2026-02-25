"use client";

import type { Task, BoardColumn } from "@/lib/types";
import { PRIORITY_COLORS, COLUMN_HEADER_COLOR, agentColorStyle } from "@/lib/constants";
import { useConfig } from "@/lib/hooks/use-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SprintTasksProps {
  tasks: Task[];
}

const DEFAULT_STATUS_ORDER: BoardColumn[] = ["in-progress", "todo", "review", "done", "backlog"];

export function SprintTasks({ tasks }: SprintTasksProps) {
  const { columnIds, config } = useConfig();
  const statusOrder: BoardColumn[] = columnIds.length > 0
    ? (["in-progress", ...columnIds.filter((c) => c !== "in-progress")] as BoardColumn[])
    : DEFAULT_STATUS_ORDER;

  const agentHexColors = Object.fromEntries(
    (config?.agents ?? []).map((a) => [a.id, a.color])
  );

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
                    <Badge variant="outline" className="text-[10px]" style={agentColorStyle(agentHexColors[task.assigned_to])}>
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
