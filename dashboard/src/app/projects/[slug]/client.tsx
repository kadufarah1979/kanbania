"use client";

import type { Project, Task } from "@/lib/types";
import { ProjectDetail } from "@/components/projects/project-detail";

interface Props {
  project: Project;
  tasks: Task[];
}

export function ProjectDetailClient({ project, tasks }: Props) {
  return <ProjectDetail project={project} tasks={tasks} />;
}
