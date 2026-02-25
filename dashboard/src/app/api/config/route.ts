import { NextResponse } from "next/server";
import { getKanbanConfig } from "@/lib/kanban/config-reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getKanbanConfig();
  return NextResponse.json(config);
}
