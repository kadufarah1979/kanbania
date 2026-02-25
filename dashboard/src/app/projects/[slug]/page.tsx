import { getProject, getAllTasks } from "@/lib/kanban/reader";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./client";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default function ProjectPage({ params }: Props) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const tasks = getAllTasks().filter((t) => t.project === params.slug);

  return <ProjectDetailClient project={project} tasks={tasks} />;
}
