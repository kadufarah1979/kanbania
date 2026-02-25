import { NextResponse } from "next/server";
import { getStats } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const stats = getStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
