import { NextResponse } from "next/server";
import { getBoardData } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const board = getBoardData();
  return NextResponse.json(board, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
