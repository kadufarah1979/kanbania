import { NextResponse } from "next/server";
import { getAllTasks, getAllSprints, getAllActivity } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Blended cost (input+output) per 1M tokens — by provider.
// Override via COST_PER_1M_TOKENS env var: '{"anthropic":9,"openai":5,"human":0}'
const DEFAULT_COST_BY_PROVIDER: Record<string, number> = {
  anthropic: 9.0,   // Claude Sonnet blend (~$3 input + $15 output, ~50/50)
  openai: 5.0,      // OpenAI GPT blend
  google: 3.0,      // Gemini blend
  human: 0,
};

// Build lookup by agent id from config at request time
import { getKanbanConfig } from "@/lib/kanban/config-reader";

function getAgentCostRate(agentId: string): number {
  try {
    const config = getKanbanConfig();
    const agent = config.agents.find((a) => a.id === agentId);
    if (agent) {
      const providerRate = DEFAULT_COST_BY_PROVIDER[agent.provider] ?? 9.0;
      // role=pm or human provider has zero cost
      if (agent.provider === "human" || agent.role === "pm") return 0;
      return providerRate;
    }
  } catch { /* config unavailable */ }
  return 9.0; // fallback
}

function tokenCostUsd(tokens: number, agentId: string): number {
  return +(tokens * getAgentCostRate(agentId) / 1_000_000).toFixed(4);
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const project = searchParams.get("project");

  let tasks = getAllTasks();
  const sprints = getAllSprints();

  if (from) tasks = tasks.filter((t) => t.created_at && t.created_at.slice(0, 10) >= from);
  if (to) tasks = tasks.filter((t) => t.created_at && t.created_at.slice(0, 10) <= to);
  if (project) tasks = tasks.filter((t) => t.project === project);

  // Summary
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);
  const totalTasks = tasks.length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const avgTokensPerPoint = totalPoints > 0 ? Math.round(totalTokens / totalPoints) : 0;
  const avgTokensPerTask = totalTasks > 0 ? Math.round(totalTokens / totalTasks) : 0;

  // Sprint costs
  const sprintMap = new Map<string, {
    sprintId: string; title: string; project: string;
    totalTokens: number; byPhase: { backlog: number; todo: number; in_progress: number; review: number };
    taskCount: number; points: number;
  }>();

  for (const sprint of sprints) {
    sprintMap.set(sprint.id, {
      sprintId: sprint.id,
      title: sprint.title,
      project: sprint.project,
      totalTokens: 0,
      byPhase: { backlog: 0, todo: 0, in_progress: 0, review: 0 },
      taskCount: 0,
      points: 0,
    });
  }

  for (const task of tasks) {
    if (!task.sprint) continue;
    let entry = sprintMap.get(task.sprint);
    if (!entry) {
      entry = {
        sprintId: task.sprint,
        title: task.sprint,
        project: task.project,
        totalTokens: 0,
        byPhase: { backlog: 0, todo: 0, in_progress: 0, review: 0 },
        taskCount: 0,
        points: 0,
      };
      sprintMap.set(task.sprint, entry);
    }
    entry.totalTokens += task.tokens_used || 0;
    entry.taskCount++;
    entry.points += task.story_points || 0;
    if (task.tokens_by_phase) {
      entry.byPhase.backlog += task.tokens_by_phase.backlog || 0;
      entry.byPhase.todo += task.tokens_by_phase.todo || 0;
      entry.byPhase.in_progress += task.tokens_by_phase.in_progress || 0;
      entry.byPhase.review += task.tokens_by_phase.review || 0;
    }
  }

  const sprintCosts = Array.from(sprintMap.values())
    .filter((s) => s.totalTokens > 0)
    .sort((a, b) => a.sprintId.localeCompare(b.sprintId));

  // Agent costs
  const agentMap = new Map<string, {
    agent: string; totalTokens: number; tasksCompleted: number;
    totalPoints: number; tokensPerPoint: number; avgTokensPerTask: number;
  }>();

  for (const task of tasks) {
    const agent = task.assigned_to || task.created_by || "unknown";
    let entry = agentMap.get(agent);
    if (!entry) {
      entry = { agent, totalTokens: 0, tasksCompleted: 0, totalPoints: 0, tokensPerPoint: 0, avgTokensPerTask: 0 };
      agentMap.set(agent, entry);
    }
    entry.totalTokens += task.tokens_used || 0;
    if (task.status === "done" || task.status === "archived") {
      entry.tasksCompleted++;
    }
    entry.totalPoints += task.story_points || 0;
  }

  const agentCosts = Array.from(agentMap.values()).map((a) => ({
    ...a,
    tokensPerPoint: a.totalPoints > 0 ? Math.round(a.totalTokens / a.totalPoints) : 0,
    avgTokensPerTask: a.tasksCompleted > 0 ? Math.round(a.totalTokens / a.tasksCompleted) : 0,
  })).sort((a, b) => b.totalTokens - a.totalTokens);

  // Timeline
  const dayMap = new Map<string, { date: string; tokens: number; taskCount: number }>();
  for (const task of tasks) {
    if (!task.created_at) continue;
    const date = task.created_at.slice(0, 10);
    let entry = dayMap.get(date);
    if (!entry) {
      entry = { date, tokens: 0, taskCount: 0 };
      dayMap.set(date, entry);
    }
    entry.tokens += task.tokens_used || 0;
    entry.taskCount++;
  }

  const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const timeline = sortedDays.map((d) => {
    cumulative += d.tokens;
    return { ...d, cumulativeTokens: cumulative };
  });

  // Project efficiency
  const projectMap = new Map<string, {
    project: string; totalTokens: number; totalPoints: number;
    tokensPerPoint: number; taskCount: number; reviewActions: number; totalActions: number;
  }>();

  for (const task of tasks) {
    const proj = task.project || "sem-projeto";
    let entry = projectMap.get(proj);
    if (!entry) {
      entry = { project: proj, totalTokens: 0, totalPoints: 0, tokensPerPoint: 0, taskCount: 0, reviewActions: 0, totalActions: 0 };
      projectMap.set(proj, entry);
    }
    entry.totalTokens += task.tokens_used || 0;
    entry.totalPoints += task.story_points || 0;
    entry.taskCount++;
    if (task.acted_by) {
      for (const act of task.acted_by) {
        entry.totalActions++;
        if (act.action && act.action.toLowerCase().includes("review")) {
          entry.reviewActions++;
        }
      }
    }
  }

  const projectEfficiency = Array.from(projectMap.values()).map((p) => ({
    project: p.project,
    totalTokens: p.totalTokens,
    totalPoints: p.totalPoints,
    tokensPerPoint: p.totalPoints > 0 ? Math.round(p.totalTokens / p.totalPoints) : 0,
    taskCount: p.taskCount,
    reworkRate: p.totalActions > 0 ? Math.round((p.reviewActions / p.totalActions) * 100) : 0,
    avgReviewCycles: p.taskCount > 0 ? +(p.reviewActions / p.taskCount).toFixed(1) : 0,
  })).sort((a, b) => b.totalTokens - a.totalTokens);

  // Agent work hours (from activity log)
  const SESSION_GAP_MS = 30 * 60 * 1000; // 30 min gap = new session
  const { items: allActivity } = getAllActivity();
  let filteredActivity = allActivity;
  if (from) filteredActivity = filteredActivity.filter((a) => a.timestamp.slice(0, 10) >= from);
  if (to) filteredActivity = filteredActivity.filter((a) => a.timestamp.slice(0, 10) <= to);

  const agentTimestamps = new Map<string, number[]>();
  for (const act of filteredActivity) {
    const agent = act.agent || "unknown";
    const ts = new Date(act.timestamp).getTime();
    if (isNaN(ts)) continue;
    if (!agentTimestamps.has(agent)) agentTimestamps.set(agent, []);
    agentTimestamps.get(agent)!.push(ts);
  }

  const agentHours: { agent: string; totalHours: number; activeDays: number; sessions: number; avgSessionHours: number }[] = [];
  Array.from(agentTimestamps.entries()).forEach(([agent, timestamps]) => {
    timestamps.sort((a: number, b: number) => a - b);
    const days = new Set(timestamps.map((t: number) => new Date(t).toISOString().slice(0, 10)));
    let sessions = 1;
    let totalMs = 0;
    let sessionStart = timestamps[0];
    let prev = timestamps[0];
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i] - prev;
      if (gap > SESSION_GAP_MS) {
        totalMs += prev - sessionStart;
        sessions++;
        sessionStart = timestamps[i];
      }
      prev = timestamps[i];
    }
    totalMs += prev - sessionStart;
    const totalHours = +(totalMs / (1000 * 60 * 60)).toFixed(1);
    const avgSessionHours = sessions > 0 ? +(totalHours / sessions).toFixed(1) : 0;
    agentHours.push({ agent, totalHours, activeDays: days.size, sessions, avgSessionHours });
  });
  agentHours.sort((a, b) => b.totalHours - a.totalHours);

  // ── Benchmark ──

  // Cost by agent
  const costByAgent = agentCosts.map((a) => {
    const hours = agentHours.find((h) => h.agent === a.agent);
    const costUsd = tokenCostUsd(a.totalTokens, a.agent);
    return {
      agent: a.agent,
      totalTokens: a.totalTokens,
      costUsd,
      tasksCompleted: a.tasksCompleted,
      totalPoints: a.totalPoints,
      costPerPoint: a.totalPoints > 0 ? +(costUsd / a.totalPoints).toFixed(2) : 0,
      costPerTask: a.tasksCompleted > 0 ? +(costUsd / a.tasksCompleted).toFixed(2) : 0,
      costPerHour: hours && hours.totalHours > 0 ? +(costUsd / hours.totalHours).toFixed(2) : 0,
      tokensPerPoint: a.tokensPerPoint,
      tokensPerTask: a.avgTokensPerTask,
      totalHours: hours?.totalHours || 0,
    };
  });

  // Total cost summary
  const totalCostUsd = +costByAgent.reduce((s, a) => s + a.costUsd, 0).toFixed(2);
  const costPerPoint = totalPoints > 0 ? +(totalCostUsd / totalPoints).toFixed(2) : 0;
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "archived").length;
  const costPerTask = doneTasks > 0 ? +(totalCostUsd / doneTasks).toFixed(2) : 0;
  const totalHoursAll = agentHours.reduce((s, h) => s + h.totalHours, 0);
  const costPerHour = totalHoursAll > 0 ? +(totalCostUsd / totalHoursAll).toFixed(2) : 0;

  // Weekly efficiency trend (tokens/point per week)
  const weekMap = new Map<string, { week: string; tokens: number; points: number }>();
  for (const task of tasks) {
    if (!task.created_at) continue;
    const d = new Date(task.created_at);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const week = monday.toISOString().slice(0, 10);
    let entry = weekMap.get(week);
    if (!entry) {
      entry = { week, tokens: 0, points: 0 };
      weekMap.set(week, entry);
    }
    entry.tokens += task.tokens_used || 0;
    entry.points += task.story_points || 0;
  }
  const weeklyEfficiency = Array.from(weekMap.values())
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({
      week: w.week,
      tokens: w.tokens,
      points: w.points,
      tokensPerPoint: w.points > 0 ? Math.round(w.tokens / w.points) : 0,
      costUsd: +(w.tokens * 9.0 / 1_000_000).toFixed(2), // avg blend
    }));

  // Complexity vs Cost (scatter data)
  const complexityCorrelation = tasks
    .filter((t) => t.story_points && t.story_points > 0 && t.tokens_used && t.tokens_used > 0)
    .map((t) => ({
      taskId: t.id,
      storyPoints: t.story_points!,
      tokens: t.tokens_used!,
      costUsd: tokenCostUsd(t.tokens_used!, t.assigned_to || t.created_by || "claude-code"),
      agent: t.assigned_to || t.created_by || "unknown",
      project: t.project,
    }));

  // Quality metrics
  const tasksWithPhase = tasks.filter((t) => t.tokens_by_phase);
  const reviewTokensTotal = tasksWithPhase.reduce((s, t) => s + (t.tokens_by_phase?.review || 0), 0);
  const allPhaseTokens = tasksWithPhase.reduce(
    (s, t) => s + (t.tokens_by_phase?.backlog || 0) + (t.tokens_by_phase?.todo || 0) + (t.tokens_by_phase?.in_progress || 0) + (t.tokens_by_phase?.review || 0),
    0
  );
  const reworkCostRatio = allPhaseTokens > 0 ? Math.round((reviewTokensTotal / allPhaseTokens) * 100) : 0;

  // First-time-right: tasks done/archived with 0 or 1 review actions
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "archived");
  const firstTimeRight = completedTasks.filter((t) => {
    const reviewActions = (t.acted_by || []).filter((a) => a.action && a.action.toLowerCase().includes("review")).length;
    return reviewActions <= 1;
  }).length;
  const firstTimeRightRate = completedTasks.length > 0 ? Math.round((firstTimeRight / completedTasks.length) * 100) : 0;

  // Cost by project
  const costByProject = projectEfficiency.map((p) => ({
    project: p.project,
    totalTokens: p.totalTokens,
    costUsd: +(p.totalTokens * 9.0 / 1_000_000).toFixed(2),
    totalPoints: p.totalPoints,
    costPerPoint: p.totalPoints > 0 ? +(p.totalTokens * 9.0 / 1_000_000 / p.totalPoints).toFixed(2) : 0,
    taskCount: p.taskCount,
    reworkRate: p.reworkRate,
    tokensPerPoint: p.tokensPerPoint,
  }));

  const benchmark = {
    costSummary: { totalCostUsd, costPerPoint, costPerTask, costPerHour, totalHours: totalHoursAll, doneTasks },
    costByAgent,
    costByProject,
    weeklyEfficiency,
    complexityCorrelation,
    quality: { reworkCostRatio, firstTimeRightRate, reviewTokensTotal, totalPhaseTokens: allPhaseTokens },
  };

  return NextResponse.json({
    summary: { totalTokens, totalTasks, totalPoints, avgTokensPerPoint, avgTokensPerTask },
    sprintCosts,
    agentCosts,
    agentHours,
    timeline,
    projectEfficiency,
    benchmark,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
