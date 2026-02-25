"use client";

import type { Task } from "@/lib/types";
import { PRIORITY_COLORS, AGENT_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Calendar, User, Hash, Target, Layers, ArrowRight, Zap } from "lucide-react";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { format, parseISO } from "date-fns";

interface TaskDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDialog({ task, open, onClose }: TaskDialogProps) {
  if (!task) return null;

  const priorityStyle = PRIORITY_COLORS[task.priority];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", priorityStyle.bg, priorityStyle.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", priorityStyle.dot)} />
              {task.priority}
            </span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{task.status}</span>
          </div>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription className="sr-only">Task details for {task.id}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {task.project && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>Project: <strong className="text-foreground">{task.project}</strong></span>
            </div>
          )}
          {task.sprint && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Sprint: <strong className="text-foreground">{task.sprint}</strong></span>
            </div>
          )}
          {task.assigned_to && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Assigned: <strong className={cn("px-1.5 py-0.5 rounded text-xs", AGENT_COLORS[task.assigned_to] || "")}>{task.assigned_to}</strong></span>
            </div>
          )}
          {task.story_points && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>Points: <strong className="text-foreground">{task.story_points}</strong></span>
            </div>
          )}
          {task.created_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: <strong className="text-foreground">{formatDate(task.created_at)}</strong></span>
            </div>
          )}
          {task.tokens_used != null && task.tokens_used > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Zap className="h-4 w-4" />
              <span>Tokens: <strong className="text-foreground">{task.tokens_used.toLocaleString()}</strong></span>
              {(() => {
                const PHASE_FLOW = ["backlog", "todo", "in_progress", "review", "done"] as const;
                const statusToPhase: Record<string, string> = { "in-progress": "in_progress", "archived": "done" };
                const currentPhase = statusToPhase[task.status] || task.status;
                const endIdx = PHASE_FLOW.indexOf(currentPhase as typeof PHASE_FLOW[number]);
                const phases = endIdx >= 0 ? PHASE_FLOW.slice(0, endIdx + 1) : PHASE_FLOW.slice(0, 4);
                const colors: Record<string, string> = {
                  backlog: "text-gray-400", todo: "text-blue-400",
                  in_progress: "text-yellow-400", review: "text-orange-400", done: "text-green-400",
                };
                const labels: Record<string, string> = {
                  backlog: "backlog", todo: "todo",
                  in_progress: "impl", review: "review", done: "done",
                };
                return (
                  <span className="flex items-center gap-2 text-xs ml-2">
                    {phases.map((p) => (
                      <span key={p} className={colors[p]}>
                        {(task.tokens_by_phase?.[p] || 0).toLocaleString()} {labels[p]}
                      </span>
                    ))}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((l) => (
              <Badge key={l} variant="secondary">{l}</Badge>
            ))}
          </div>
        )}

        {(task.depends_on.length > 0 || task.blocks.length > 0) && (
          <>
            <Separator />
            <div className="text-sm space-y-1">
              {task.depends_on.length > 0 && (
                <p className="text-muted-foreground">Depends on: {task.depends_on.map((d) => <Badge key={d} variant="outline" className="ml-1 text-xs">{d}</Badge>)}</p>
              )}
              {task.blocks.length > 0 && (
                <p className="text-muted-foreground">Blocks: {task.blocks.map((b) => <Badge key={b} variant="outline" className="ml-1 text-xs">{b}</Badge>)}</p>
              )}
            </div>
          </>
        )}

        {task.content && (
          <>
            <Separator />
            <MarkdownContent content={task.content} />
          </>
        )}

        {task.acted_by && task.acted_by.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">History</h4>
              <div className="space-y-1.5">
                {task.acted_by.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                    <span className={cn("font-medium px-1.5 py-0.5 rounded", AGENT_COLORS[entry.agent] || "")}>{entry.agent}</span>
                    <span>{entry.action}</span>
                    {entry.date && <span>{formatDate(entry.date)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy HH:mm");
  } catch {
    return dateStr;
  }
}
