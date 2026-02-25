import { NextResponse } from "next/server";
import { getAllSprints, getAllTasks, getAllOKRs } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export function GET(_req: Request, { params }: Props) {
  const sprints = getAllSprints();
  const sprint = sprints.find((s) => s.id === params.id);

  if (!sprint) {
    return NextResponse.json(null, { status: 404 });
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
