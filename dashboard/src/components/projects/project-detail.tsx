"use client";

import type { Project, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PRIORITY_COLORS, COLUMN_HEADER_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FolderOpen, GitBranch, Calendar, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { ProjectDocs } from "@/components/projects/project-docs";
import { format, parseISO } from "date-fns";

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
}

export function ProjectDetail({ project, tasks }: ProjectDetailProps) {
  const tasksByStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
            {project.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {project.repo && (
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-4 w-4" />
            {project.repo}
          </span>
        )}
        {project.created_at && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Created {format(parseISO(project.created_at), "MMM d, yyyy")}
          </span>
        )}
      </div>

      {project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tech_stack.map((tech) => (
            <Badge key={tech} variant="outline">{tech}</Badge>
          ))}
        </div>
      )}

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3">Tasks ({tasks.length})</h3>
        <div className="flex gap-3 mb-4 text-sm">
          {Object.entries(tasksByStatus).map(([status, count]) => (
            <span key={status} className={cn("capitalize", COLUMN_HEADER_COLOR[status as keyof typeof COLUMN_HEADER_COLOR] || "")}>
              {status}: {count}
            </span>
          ))}
        </div>
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 rounded-md border bg-card p-2.5 border-l-4",
                PRIORITY_COLORS[task.priority].border
              )}
            >
              <span className="text-xs font-mono text-muted-foreground w-20">{task.id}</span>
              <span className={cn("text-xs capitalize w-24", COLUMN_HEADER_COLOR[task.status])}>{task.status}</span>
              <span className="text-sm flex-1">{task.title}</span>
              {task.story_points && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{task.story_points}pt</span>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks for this project</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Documentos
        </h3>
        <ProjectDocs projectSlug={project.id} />
      </div>

      {project.content && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">Details</h3>
            <MarkdownContent content={project.content} />
          </div>
        </>
      )}
    </div>
  );
}
