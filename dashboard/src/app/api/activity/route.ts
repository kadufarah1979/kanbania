import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getActivity } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = getActivity(limit, offset);
  return NextResponse.json(result);
}
