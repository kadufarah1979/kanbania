"use client";

import type { Task } from "@/lib/types";
import { PRIORITY_COLORS, AGENT_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Hash } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityStyle = PRIORITY_COLORS[task.priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-foreground/20 border-l-4",
        priorityStyle.border
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground font-mono">{task.id}</span>
        {task.story_points && (
          <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">{task.story_points}pt</span>
        )}
      </div>

      <h4 className="text-sm font-medium leading-snug mb-2">{task.title}</h4>

      <div className="flex flex-wrap gap-1 mb-2">
        {task.labels.map((label) => (
          <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">
            {label}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {task.project && (
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {task.project}
          </span>
        )}
        {task.assigned_to && (
          <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium", AGENT_COLORS[task.assigned_to] || "")}>
            <User className="h-3 w-3" />
            {task.assigned_to}
          </span>
        )}
      </div>
    </button>
  );
}
