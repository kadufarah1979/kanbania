import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_EVENTS = 2000;

export async function GET() {
  try {
    const kanbanRoot = process.env.KANBAN_ROOT || "/home/carlosfarah/kanbania-fresh";
    const hooksLog = path.join(kanbanRoot, "logs", "hooks-events.jsonl");

    if (!fs.existsSync(hooksLog)) {
      return NextResponse.json({ events: [] });
    }

    const content = fs.readFileSync(hooksLog, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const recent = lines.slice(-MAX_EVENTS);

    const events = recent.flatMap((line) => {
      try {
        const e = JSON.parse(line);
        // Descartar eventos malformados (sem campos obrigatorios)
        if (!e.agent_id || !e.hook_type || !e.timestamp || !e.payload) return [];
        return [e];
      } catch {
        return [];
      }
    });

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
