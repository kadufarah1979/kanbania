import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

export function GET() {
  const projects = getAllProjects();
  return NextResponse.json(projects);
}
