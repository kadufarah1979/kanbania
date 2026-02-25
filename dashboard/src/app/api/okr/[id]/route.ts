import { NextResponse } from "next/server";
import { getAllOKRs, getAllSprints, getAllTasks, getAllProjects, computeSprintStats } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export function GET(_req: Request, { params }: Props) {
  const okrs = getAllOKRs();
  const okr = okrs.find((o) => o.id === params.id);

  if (!okr) {
    return NextResponse.json(null, { status: 404 });
  }

  const allSprints = getAllSprints();
  const linkedSprints = allSprints
    .filter((s) => s.okrs?.includes(okr.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  const allTasks = getAllTasks();

  const sprintsWithStats = linkedSprints.map((s) => {
    const tasks = allTasks.filter((t) => t.sprint === s.id);
    return { ...s, ...computeSprintStats(tasks) };
  });

  const projectId = linkedSprints[0]?.project || "";
  const allProjects = getAllProjects();
  const project = allProjects.find((p) => p.id === projectId);

  return NextResponse.json({
    okr,
    sprints: sprintsWithStats,
    project: project ? { id: project.id, name: project.name } : null,
  });
}
