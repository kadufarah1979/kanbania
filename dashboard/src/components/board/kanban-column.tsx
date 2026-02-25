"use client";

import { useState } from "react";
import type { Task, BoardColumn } from "@/lib/types";
import { COLUMN_BG, COLUMN_HEADER_COLOR } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

const COLUMN_ABBREV_DEFAULTS: Record<string, string> = {
  backlog: "B",
  todo: "TD",
  "in-progress": "IP",
  review: "R",
  done: "D",
  archived: "F",
};

function getColumnAbbrev(id: string): string {
  return COLUMN_ABBREV_DEFAULTS[id] ?? id.slice(0, 2).toUpperCase();
}

interface KanbanColumnProps {
  columnId: BoardColumn;
  name: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  collapsed?: boolean;
}

export function KanbanColumn({ columnId, name, tasks, onTaskClick, collapsed = false }: KanbanColumnProps) {
  const [expanded, setExpanded] = useState(false);
  const isCollapsed = collapsed && !expanded;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        isCollapsed ? "p-2 min-w-[48px] max-w-[56px] items-center cursor-pointer" : "flex flex-col p-3 min-w-[260px] flex-1",
        COLUMN_BG[columnId]
      )}
      onClick={isCollapsed && tasks.length > 0 ? () => setExpanded(true) : undefined}
    >
      <div className={cn("flex items-center", isCollapsed ? "flex-col gap-1 mb-0" : "justify-between mb-3")}>
        <h3
          className={cn("text-sm font-semibold", COLUMN_HEADER_COLOR[columnId], !isCollapsed && collapsed && "cursor-pointer hover:opacity-70")}
          title={name}
          onClick={!isCollapsed && collapsed ? () => setExpanded(false) : undefined}
        >
          {isCollapsed ? getColumnAbbrev(columnId) : name}
        </h3>
        <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-2 flex-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      )}
    </div>
  );
}
