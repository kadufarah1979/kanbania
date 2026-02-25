"use client";

import type { Task } from "@/lib/types";
interface SprintProgressProps {
  tasks: Task[];
  capacity: number;
}

export function SprintProgress({ tasks, capacity }: SprintProgressProps) {
  const done = tasks.filter((t) => t.status === "done").reduce((sum, t) => sum + (t.story_points || 0), 0);
  const inProgress = tasks.filter((t) => t.status === "in-progress").reduce((sum, t) => sum + (t.story_points || 0), 0);
  const total = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

  const donePercent = capacity > 0 ? (done / capacity) * 100 : 0;
  const progressPercent = capacity > 0 ? (inProgress / capacity) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sprint Progress</span>
        <span className="font-medium">{done} / {total} pts ({capacity} capacity)</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden flex">
        <div className="bg-green-500 transition-all duration-500" style={{ width: `${donePercent}%` }} />
        <div className="bg-yellow-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Done: {done}pts</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> In Progress: {inProgress}pts</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Remaining: {total - done - inProgress}pts</span>
      </div>
    </div>
  );
}
