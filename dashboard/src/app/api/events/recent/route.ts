import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KANBAN_ROOT = process.env.KANBAN_ROOT || "/home/carlosfarah/kanbania";
const HOOKS_LOG = path.join(KANBAN_ROOT, "logs", "hooks-events.jsonl");
const MAX_EVENTS = 300;

export async function GET() {
  try {
    if (!fs.existsSync(HOOKS_LOG)) {
      return NextResponse.json({ events: [] });
    }

    const content = fs.readFileSync(HOOKS_LOG, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const recent = lines.slice(-MAX_EVENTS);

    const events = recent.flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
