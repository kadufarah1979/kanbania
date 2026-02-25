"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, GitBranch, BarChart3 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{project.name}</CardTitle>
            </div>
            <Badge
              variant={project.status === "active" ? "default" : "secondary"}
              className="capitalize text-xs"
            >
              {project.status}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
          {project.repo && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {project.repo}
            </p>
          )}
          <Link
            href={`/insights/${project.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <BarChart3 className="h-3 w-3" />
            Ver Insights
          </Link>
        </CardContent>
      </Card>
    </Link>
  );
}
