"use client";

import { useCallback } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";
import type { WSMessage } from "@/lib/types";

export default function ProjectsPage() {
  const { data: projects, loading, refetch } = useProjects();

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "projects") refetch();
    },
    [refetch]
  );

  useWebSocket(handleWsMessage);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Projects</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              No projects found. Create a project directory in projects/ with a README.md to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
