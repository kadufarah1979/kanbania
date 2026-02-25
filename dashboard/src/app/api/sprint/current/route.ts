import { NextResponse } from "next/server";
import { getCurrentSprint, getAllTasks, getAllOKRs } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

export function GET() {
  const sprint = getCurrentSprint();
  if (!sprint) {
    return NextResponse.json(null);
  }

  const allTasks = getAllTasks();
  sprint.tasks = allTasks.filter((t) => t.sprint === sprint.id);

  const allOkrs = getAllOKRs();
  const linkedOkrs = sprint.okrs?.length
    ? allOkrs
        .filter((o) => sprint.okrs.includes(o.id))
        .map((o) => ({ id: o.id, objective: o.objective }))
    : [];

  return NextResponse.json({ ...sprint, linkedOkrs });
}
