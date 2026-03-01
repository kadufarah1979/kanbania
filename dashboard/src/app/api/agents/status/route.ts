import { NextResponse } from "next/server";
import fs from "fs";
import { getAllTasks, getActivity, getConfig } from "@/lib/kanban/reader";
import { KANBAN_ROOT } from "@/lib/constants";

export interface AgentStatus {
  agent: string;
  status: "active" | "working" | "reviewing" | "queued" | "idle" | "offline";
  task_id: string | null;
  task_priority: string | null;
  description: string;
  updated_at: string;          // última atividade real (hook event), nunca data de task
  task_queued_at: string | null; // quando a task entrou na fila (data da task)
  queue_depth: number;          // qtd de tasks pendentes para este agente
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

/** Get the most recent hook event timestamp for an agent from hooks-events.jsonl. */
function getLastHookTimestamp(agent: string): string | null {
  try {
    const logPath = `${KANBAN_ROOT}/logs/hooks-events.jsonl`;
    if (!fs.existsSync(logPath)) return null;
    const lines = fs.readFileSync(logPath, "utf-8").split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 500); i--) {
      try {
        const e = JSON.parse(lines[i]);
        if (e.agent_id === agent && e.timestamp) return e.timestamp;
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return null;
}

/** Returns true if the agent heartbeat is alive (<3 min). */
function isHeartbeatAlive(agent: string): boolean {
  const heartbeatPath = `${KANBAN_ROOT}/agents/${agent}.heartbeat`;
  try {
    const stat = fs.statSync(heartbeatPath);
    return Date.now() - stat.mtimeMs < 3 * 60 * 1000;
  } catch {
    return false;
  }
}

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

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
    const hookTs = getLastHookTimestamp(agent);
    const isAlive = isHeartbeatAlive(agent);
    const isReallyActive = hookTs !== null && Date.now() - new Date(hookTs).getTime() < 2 * 60 * 1000;

    // Fallback updated_at: hook timestamp, then last activity entry, then now
    const lastEntry = lastActivityEntry(agent);
    const updatedAt = hookTs ?? lastEntry?.timestamp ?? new Date().toISOString();

    // In-progress tasks assigned to agent
    const workingTasks = visibleTasks
      .filter((t) => t.status === "in-progress" && t.assigned_to === agent)
      .sort(
        (a, b) =>
          new Date(taskUpdatedAt(b)).getTime() - new Date(taskUpdatedAt(a)).getTime()
      );

    // Prefer tasks where agent was the last actor
    const activeWork = workingTasks.find((t) => lastActorIsAgent(t, agent));
    const assignedWork = workingTasks[0];

    // Review tasks where agent is requested reviewer
    const reviewTasks = visibleTasks
      .filter(
        (t) =>
          t.status === "review" &&
          Array.isArray(t.review_requested_from) &&
          t.review_requested_from.includes(agent)
      )
      .sort((a, b) => {
        const pa = PRIORITY_RANK[a.priority ?? "medium"] ?? 2;
        const pb = PRIORITY_RANK[b.priority ?? "medium"] ?? 2;
        if (pa !== pb) return pa - pb;
        const na = parseInt((a.id ?? "").replace(/\D/g, ""), 10) || 0;
        const nb = parseInt((b.id ?? "").replace(/\D/g, ""), 10) || 0;
        return na - nb;
      });

    const reviewTask = reviewTasks[0] ?? null;

    // queue_depth = review tasks + in-progress assigned tasks
    const queueDepth = reviewTasks.length + workingTasks.length;

    // Determine status using the new model
    // active   → hook event nos últimos 2 min
    // working  → heartbeat vivo + in-progress onde agent foi último actor
    // reviewing→ heartbeat vivo + task em review na fila
    // queued   → heartbeat MORTO mas tem task pendente
    // idle     → heartbeat vivo, sem tasks ativas
    // offline  → heartbeat morto, sem tasks ativas

    if (isReallyActive) {
      const contextTask = activeWork ?? assignedWork ?? reviewTask ?? null;
      statuses.push({
        agent,
        status: "active",
        task_id: contextTask?.id ?? null,
        task_priority: contextTask?.priority ?? null,
        description: contextTask?.title ?? "Executando",
        updated_at: updatedAt,
        task_queued_at: contextTask ? taskUpdatedAt(contextTask) : null,
        queue_depth: queueDepth,
      });
      continue;
    }

    if (isAlive && activeWork) {
      statuses.push({
        agent,
        status: "working",
        task_id: activeWork.id,
        task_priority: activeWork.priority ?? null,
        description: activeWork.title,
        updated_at: updatedAt,
        task_queued_at: taskUpdatedAt(activeWork),
        queue_depth: queueDepth,
      });
      continue;
    }

    if (isAlive && reviewTask) {
      statuses.push({
        agent,
        status: "reviewing",
        task_id: reviewTask.id,
        task_priority: reviewTask.priority ?? null,
        description: reviewTask.title,
        updated_at: updatedAt,
        task_queued_at: taskUpdatedAt(reviewTask),
        queue_depth: queueDepth,
      });
      continue;
    }

    if (!isAlive && (reviewTask || assignedWork)) {
      const pendingTask = reviewTask ?? assignedWork!;
      statuses.push({
        agent,
        status: "queued",
        task_id: pendingTask.id,
        task_priority: pendingTask.priority ?? null,
        description: pendingTask.title,
        updated_at: updatedAt,
        task_queued_at: taskUpdatedAt(pendingTask),
        queue_depth: queueDepth,
      });
      continue;
    }

    if (isAlive) {
      const idleDesc = lastEntry?.entity_id
        ? `Ultima acao: ${lastEntry.action || "?"} ${lastEntry.entity_id}`
        : "Sem atividade em andamento";
      statuses.push({
        agent,
        status: "idle",
        task_id: null,
        task_priority: null,
        description: idleDesc,
        updated_at: updatedAt,
        task_queued_at: null,
        queue_depth: 0,
      });
      continue;
    }

    statuses.push({
      agent,
      status: "offline",
      task_id: null,
      task_priority: null,
      description: "Loop parado",
      updated_at: updatedAt,
      task_queued_at: null,
      queue_depth: 0,
    });
  }

  return NextResponse.json(statuses, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
