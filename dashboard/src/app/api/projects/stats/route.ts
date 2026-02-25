import { NextResponse } from "next/server";
import { getAllTasks, getAllProjects, getAllOKRs, getAllSprints } from "@/lib/kanban/reader";
import type { BoardColumn, OKR, Sprint } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectStat {
  tasks: Record<BoardColumn, number>;
  totalPoints: number;
  completedPoints: number;
  okrs: Pick<OKR, "id" | "objective" | "status" | "period" | "key_results">[];
  sprints: Pick<Sprint, "id" | "title" | "status" | "start_date" | "end_date" | "capacity">[];
}

export function GET() {
  const tasks = getAllTasks();
  const projects = getAllProjects();
  const okrs = getAllOKRs();
  const sprints = getAllSprints();

  const stats: Record<string, ProjectStat> = {};

  for (const project of projects) {
    const projectOkrs = okrs.filter((o) => {
      const linkedSprints = sprints.filter(
        (s) => s.project === project.id && s.okrs?.includes(o.id)
      );
      return linkedSprints.length > 0;
    });

    const projectSprints = sprints
      .filter((s) => s.project === project.id)
      .sort((a, b) => a.id.localeCompare(b.id));

    stats[project.id] = {
      tasks: { backlog: 0, todo: 0, "in-progress": 0, review: 0, done: 0, archived: 0 },
      totalPoints: 0,
      completedPoints: 0,
      okrs: projectOkrs.map((o) => ({
        id: o.id,
        objective: o.objective,
        status: o.status,
        period: o.period,
        key_results: o.key_results,
      })),
      sprints: projectSprints.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        start_date: s.start_date,
        end_date: s.end_date,
        capacity: s.capacity,
      })),
    };
  }

  for (const task of tasks) {
    if (task.project && stats[task.project]) {
      stats[task.project].tasks[task.status]++;
      const pts = task.story_points || 0;
      stats[task.project].totalPoints += pts;
      if (task.status === "done" || task.status === "archived") {
        stats[task.project].completedPoints += pts;
      }
    }
  }

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
