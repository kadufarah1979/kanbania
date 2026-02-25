import { NextRequest, NextResponse } from "next/server";
import { getAllSprints, getAllTasks, getAllProjects, computeSprintStats } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const projectFilter = req.nextUrl.searchParams.get("project");

  const allSprints = getAllSprints();
  const allTasks = getAllTasks();
  const allProjects = getAllProjects();

  const filtered = projectFilter
    ? allSprints.filter((s) => s.project === projectFilter)
    : allSprints;

  const sorted = filtered.sort((a, b) => b.id.localeCompare(a.id));

  const project = projectFilter
    ? allProjects.find((p) => p.id === projectFilter) || null
    : null;

  const sprints = sorted.map((s) => {
    const tasks = allTasks.filter((t) => t.sprint === s.id);
    return { ...s, ...computeSprintStats(tasks) };
  });

  return NextResponse.json({
    project: project ? { id: project.id, name: project.name } : null,
    sprints,
  });
}
