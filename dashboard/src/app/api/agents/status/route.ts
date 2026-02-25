import { NextResponse } from "next/server";
import fs from "fs";
import { getAllTasks, getActivity, getConfig } from "@/lib/kanban/reader";

export interface AgentStatus {
  agent: string;
  status: "idle" | "working" | "reviewing" | "waiting" | "offline";
  task_id: string | null;
  description: string;
  updated_at: string;
}

export const dynamic = "force-dynamic";

function projectFromReferer(request: Request): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const match = url.pathname.match(/^\/board\/([^/]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function taskUpdatedAt(task: { acted_by?: { date?: string }[]; created_at?: string }): string {
  const now = Date.now();
  const maxFutureSkewMs = 5 * 60 * 1000;
  const dates = (task.acted_by || [])
    .map((a) => a?.date || "")
    .filter(Boolean)
    .concat(task.created_at || "");
  const sorted = dates
    .map((d) => ({ raw: d, ts: new Date(d).getTime() }))
    .filter((d) => Number.isFinite(d.ts))
    .filter((d) => d.ts <= now + maxFutureSkewMs)
    .sort((a, b) => b.ts - a.ts);
  return sorted[0]?.raw || new Date(now).toISOString();
}

/** Check if the last acted_by entry for this task was made by this agent. */
function lastActorIsAgent(
  task: { acted_by?: { agent?: string; date?: string }[] },
  agent: string
): boolean {
  const entries = task.acted_by || [];
  if (entries.length === 0) return false;
  const last = entries[entries.length - 1];
  return last?.agent === agent;
}

/** Get the most recent activity.jsonl entry for an agent. */
function lastActivityEntry(agent: string): { timestamp: string; entity_id?: string; action?: string; details?: string } | null {
  const { items } = getActivity(200);
  return items.find((a) => a.agent === agent) || null;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectFilter = searchParams.get("project") ?? projectFromReferer(request);
  const tasks = getAllTasks();
  const visibleTasks = projectFilter
    ? tasks.filter((t) => t.project === projectFilter)
    : tasks;
  const cfg = getConfig();
  const configuredAgents = (cfg?.agents || []).map((a) => a.id);

  const statuses: AgentStatus[] = [];

  for (const agent of configuredAgents) {
    // 1. Check in-progress tasks where the agent is assigned AND was the last actor
    //    (avoids showing "Trabalhando" on tasks moved to in-progress by codex rejection)
    const workingTasks = visibleTasks
      .filter((t) => t.status === "in-progress" && t.assigned_to === agent)
      .sort(
        (a, b) =>
          new Date(taskUpdatedAt(b)).getTime() - new Date(taskUpdatedAt(a)).getTime()
      );

    // Prefer tasks where agent was the last actor (actively working)
    const activeWork = workingTasks.find((t) => lastActorIsAgent(t, agent));
    // Fall back to any assigned task if the agent has recent activity on it
    const assignedWork = workingTasks[0];

    if (activeWork) {
      statuses.push({
        agent,
        status: "working",
        task_id: activeWork.id,
        description: activeWork.title,
        updated_at: taskUpdatedAt(activeWork),
      });
      continue;
    }

    // 2. Check review tasks where agent is requested reviewer
    const reviewTask = visibleTasks
      .filter(
        (t) =>
          t.status === "review" &&
          Array.isArray(t.review_requested_from) &&
          t.review_requested_from.includes(agent)
      )
      .sort(
        (a, b) =>
          new Date(taskUpdatedAt(b)).getTime() - new Date(taskUpdatedAt(a)).getTime()
      )[0];

    if (reviewTask) {
      statuses.push({
        agent,
        status: "reviewing",
        task_id: reviewTask.id,
        description: reviewTask.title,
        updated_at: taskUpdatedAt(reviewTask),
      });
      continue;
    }

    // 3. If agent has assigned in-progress tasks but wasn't last actor,
    //    show as "waiting" (task returned from review, agent hasn't started rework)
    if (assignedWork) {
      statuses.push({
        agent,
        status: "waiting",
        task_id: assignedWork.id,
        description: `Rework pendente: ${assignedWork.title}`,
        updated_at: taskUpdatedAt(assignedWork),
      });
      continue;
    }

    // 4. Idle — use activity log for context
    const lastEntry = lastActivityEntry(agent);
    const idleDesc = lastEntry?.entity_id
      ? `Ultima acao: ${lastEntry.action || "?"} ${lastEntry.entity_id}`
      : "Sem atividade em andamento";

    // 4b. Check heartbeat — if stale or missing, agent is offline
    // Heartbeat em KANBAN_ROOT/agents/ para garantir acesso pelo servidor Next.js
    const kanbanRoot = process.env.KANBAN_ROOT || "/home/carlosfarah/kanbania";
    const heartbeatPath = `${kanbanRoot}/agents/${agent}.heartbeat`;
    let isOffline = false;
    try {
      const stat = fs.statSync(heartbeatPath);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs > 3 * 60 * 1000) isOffline = true;
    } catch {
      isOffline = true;
    }

    if (isOffline) {
      statuses.push({
        agent,
        status: "offline",
        task_id: null,
        description: "Loop parado",
        updated_at: lastEntry?.timestamp || new Date().toISOString(),
      });
      continue;
    }

    statuses.push({
      agent,
      status: "idle",
      task_id: null,
      description: idleDesc,
      updated_at: lastEntry?.timestamp || new Date().toISOString(),
    });
  }

  return NextResponse.json(statuses, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
