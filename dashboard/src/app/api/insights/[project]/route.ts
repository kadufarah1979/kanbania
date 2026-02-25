import { NextResponse } from "next/server";
import { getAllTasks, getAllSprints, getAllOKRs } from "@/lib/kanban/reader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(req: Request, { params }: { params: { project: string } }) {
  const projectSlug = params.project;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let allTasks = getAllTasks();
  const allSprints = getAllSprints();
  const allOKRs = getAllOKRs();

  if (from) allTasks = allTasks.filter((t) => t.created_at && t.created_at.slice(0, 10) >= from);
  if (to) allTasks = allTasks.filter((t) => t.created_at && t.created_at.slice(0, 10) <= to);

  const tasks = allTasks.filter((t) => t.project === projectSlug);

  // Summary
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);
  const totalTasks = tasks.length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const doneTasks = tasks.filter((t) => t.status === "done" || t.status === "archived").length;
  const avgTokensPerPoint = totalPoints > 0 ? Math.round(totalTokens / totalPoints) : 0;
  const avgTokensPerTask = totalTasks > 0 ? Math.round(totalTokens / totalTasks) : 0;

  // Sprint costs (only sprints with tasks in this project)
  const sprintIds = new Set(tasks.map((t) => t.sprint).filter(Boolean));
  const projectSprints = allSprints.filter((s) => s.project === projectSlug || sprintIds.has(s.id));

  const sprintMap = new Map<string, {
    sprintId: string; title: string; status: string;
    totalTokens: number; byPhase: { backlog: number; todo: number; in_progress: number; review: number };
    taskCount: number; points: number;
  }>();

  for (const sprint of projectSprints) {
    sprintMap.set(sprint.id, {
      sprintId: sprint.id,
      title: sprint.title,
      status: sprint.status,
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
        sprintId: task.sprint, title: task.sprint, status: "unknown",
        totalTokens: 0, byPhase: { backlog: 0, todo: 0, in_progress: 0, review: 0 },
        taskCount: 0, points: 0,
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
    .sort((a, b) => a.sprintId.localeCompare(b.sprintId));

  // Velocity: points per sprint (only completed/active sprints)
  const velocity = sprintCosts
    .filter((s) => s.points > 0)
    .map((s) => ({ sprintId: s.sprintId, points: s.points, tokens: s.totalTokens, tasks: s.taskCount }));

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
    if (task.status === "done" || task.status === "archived") entry.tasksCompleted++;
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
    if (!entry) { entry = { date, tokens: 0, taskCount: 0 }; dayMap.set(date, entry); }
    entry.tokens += task.tokens_used || 0;
    entry.taskCount++;
  }

  const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const timeline = sortedDays.map((d) => {
    cumulative += d.tokens;
    return { ...d, cumulativeTokens: cumulative };
  });

  // Tasks by status
  const tasksByStatus: Record<string, number> = {
    backlog: 0, todo: 0, "in-progress": 0, review: 0, done: 0, archived: 0,
  };
  for (const task of tasks) tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1;

  // Top tasks by tokens
  const topTasks = [...tasks]
    .filter((t) => (t.tokens_used || 0) > 0)
    .sort((a, b) => (b.tokens_used || 0) - (a.tokens_used || 0))
    .slice(0, 15)
    .map((t) => ({
      id: t.id, title: t.title, status: t.status, sprint: t.sprint,
      tokens_used: t.tokens_used, story_points: t.story_points, assigned_to: t.assigned_to,
    }));

  // OKRs linked to this project (via tasks that reference okr field)
  const okrIds = new Set(tasks.map((t) => t.okr).filter(Boolean));
  const okrs = allOKRs
    .filter((o) => okrIds.has(o.id))
    .map((okr) => {
      const okrTasks = tasks.filter((t) => t.okr === okr.id);
      const okrTokens = okrTasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);
      const okrDone = okrTasks.filter((t) => t.status === "done" || t.status === "archived").length;
      return {
        id: okr.id,
        objective: okr.objective,
        period: okr.period,
        status: okr.status,
        key_results: okr.key_results,
        taskCount: okrTasks.length,
        tasksDone: okrDone,
        totalTokens: okrTokens,
      };
    });

  return NextResponse.json({
    project: projectSlug,
    summary: { totalTokens, totalTasks, totalPoints, doneTasks, avgTokensPerPoint, avgTokensPerTask },
    sprintCosts,
    velocity,
    agentCosts,
    timeline,
    tasksByStatus,
    topTasks,
    okrs,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
