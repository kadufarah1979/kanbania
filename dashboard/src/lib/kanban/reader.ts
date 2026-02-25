import fs from "fs";
import path from "path";
import { parseMarkdownFile, parseYamlFile, parseJsonlFile, parseJsonlFileTail } from "./parser";
import { KANBAN_ROOT, PATHS } from "../constants";
import type {
  Task,
  BoardData,
  BoardColumn,
  Sprint,
  OKR,
  Project,
  Activity,
  KanbanConfig,
  Stats,
  Priority,
} from "../types";

function resolve(...parts: string[]) {
  return path.join(KANBAN_ROOT, ...parts);
}

// ── In-memory cache with TTL ─────────────────────────────────────────────────
const CACHE_TTL_MS = 5_000;
const cache = new Map<string, { data: unknown; ts: number }>();

function cached<T>(key: string, fn: () => T): T {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[cache] HIT  ${key}`);
    }
    return entry.data as T;
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`[cache] MISS ${key}`);
  }
  const data = fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

export function invalidateCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

function listMdFiles(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

function readTask(filePath: string, status: BoardColumn): Task | null {
  const parsed = parseMarkdownFile(filePath);
  if (!parsed) return null;
  const fm = parsed.frontmatter as Record<string, unknown>;
  return {
    id: (fm.id as string) || path.basename(filePath, ".md"),
    version: Number(fm.version || 1),
    title: (fm.title as string) || "Untitled",
    project: (fm.project as string) || "",
    sprint: (fm.sprint as string) || null,
    okr: (fm.okr as string) || null,
    priority: (fm.priority as Priority) || "medium",
    labels: (fm.labels as string[]) || [],
    story_points: (fm.story_points as number) || null,
    created_at: (fm.created_at as string) || "",
    created_by: (fm.created_by as string) || "",
    assigned_to: (fm.assigned_to as string) || null,
    review_requested_from: (fm.review_requested_from as string[]) || [],
    depends_on: (fm.depends_on as string[]) || [],
    blocks: (fm.blocks as string[]) || [],
    acted_by: (fm.acted_by as Task["acted_by"]) || [],
    status,
    content: parsed.content,
    tokens_used: (fm.tokens_used as number) || null,
    tokens_by_phase: (fm.tokens_by_phase as Task["tokens_by_phase"]) || null,
  };
}

export function getAllTasks(): Task[] {
  return cached("allTasks", () => {
    const columns: BoardColumn[] = ["backlog", "todo", "in-progress", "review", "done", "archived"];
    const tasks: Task[] = [];

    for (const col of columns) {
      const dir = resolve(PATHS[col]);
      const files = listMdFiles(dir);
      for (const file of files) {
        const task = readTask(file, col);
        if (task) tasks.push(task);
      }
    }

    return tasks;
  });
}

export function getBoardData(): BoardData {
  const tasks = getAllTasks();
  const board: BoardData = {
    backlog: [],
    todo: [],
    "in-progress": [],
    review: [],
    done: [],
    archived: [],
  };

  for (const task of tasks) {
    board[task.status].push(task);
  }

  // Sort each column by priority
  const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const col of Object.keys(board) as BoardColumn[]) {
    board[col].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  return board;
}

export function getCurrentSprint(): Sprint | null {
  return cached("currentSprint", () => _getCurrentSprint());
}

function _getCurrentSprint(): Sprint | null {
  const currentPath = resolve(PATHS.sprints, "current.md");
  try {
    const content = fs.readFileSync(currentPath, "utf-8");
    const match = content.match(/\*\*Sprint ativa\*\*:\s*(sprint-\d+)/);
    if (!match) return null;

    const sprintId = match[1];
    const sprintPath = resolve(PATHS.sprints, `${sprintId}.md`);
    const parsed = parseMarkdownFile(sprintPath);
    if (!parsed) return null;

    const fm = parsed.frontmatter as Record<string, unknown>;
    return {
      id: (fm.id as string) || sprintId,
      title: (fm.title as string) || "",
      project: (fm.project as string) || "",
      goal: (fm.goal as string) || "",
      start_date: (fm.start_date as string) || "",
      end_date: (fm.end_date as string) || "",
      status: (fm.status as Sprint["status"]) || "active",
      capacity: (fm.capacity as number) || 21,
      created_by: (fm.created_by as string) || "",
      okrs: (fm.okrs as string[]) || [],
      acted_by: (fm.acted_by as Sprint["acted_by"]) || [],
    };
  } catch {
    return null;
  }
}

export function getAllProjects(): Project[] {
  return cached("allProjects", () => {
    const projectsDir = resolve(PATHS.projects);
    try {
      const dirs = fs.readdirSync(projectsDir).filter((d) => {
        try {
          return fs.statSync(path.join(projectsDir, d)).isDirectory();
        } catch {
          return false;
        }
      });

      return dirs
        .map((dir) => {
          const readmePath = path.join(projectsDir, dir, "README.md");
          const parsed = parseMarkdownFile(readmePath);
          if (!parsed) return null;

          const fm = parsed.frontmatter as Record<string, unknown>;
          return {
            id: (fm.id as string) || dir,
            name: (fm.name as string) || dir,
            description: (fm.description as string) || "",
            repo: (fm.repo as string) || "",
            tech_stack: (fm.tech_stack as string[]) || [],
            status: (fm.status as Project["status"]) || "active",
            created_at: (fm.created_at as string) || "",
            created_by: (fm.created_by as string) || "",
            content: parsed.content,
          } satisfies Project;
        })
        .filter((p): p is Project => p !== null);
    } catch {
      return [];
    }
  });
}

export function getProject(slug: string): Project | null {
  const readmePath = resolve(PATHS.projects, slug, "README.md");
  const parsed = parseMarkdownFile(readmePath);
  if (!parsed) return null;

  const fm = parsed.frontmatter as Record<string, unknown>;
  return {
    id: (fm.id as string) || slug,
    name: (fm.name as string) || slug,
    description: (fm.description as string) || "",
    repo: (fm.repo as string) || "",
    tech_stack: (fm.tech_stack as string[]) || [],
    status: (fm.status as Project["status"]) || "active",
    created_at: (fm.created_at as string) || "",
    created_by: (fm.created_by as string) || "",
    content: parsed.content,
  };
}

export function getAllOKRs(): OKR[] {
  return cached("allOKRs", () => {
    const okrsDir = resolve(PATHS.okrs);
    const files = listMdFiles(okrsDir);
    return files
      .map((file) => {
        const parsed = parseMarkdownFile(file);
        if (!parsed) return null;
        const fm = parsed.frontmatter as Record<string, unknown>;
        return {
          id: (fm.id as string) || path.basename(file, ".md"),
          period: (fm.period as string) || "",
          objective: (fm.objective as string) || "",
          created_at: (fm.created_at as string) || "",
          created_by: (fm.created_by as string) || "",
          status: (fm.status as OKR["status"]) || "active",
          key_results: (fm.key_results as OKR["key_results"]) || [],
          acted_by: (fm.acted_by as OKR["acted_by"]) || [],
        } satisfies OKR;
      })
      .filter((o): o is OKR => o !== null);
  });
}

export function getAllSprints(): Sprint[] {
  return cached("allSprints", () => {
    const sprintsDir = resolve(PATHS.sprints);
    const archiveSprintsDir = resolve("archive/sprints");
    const activeFiles = listMdFiles(sprintsDir).filter(
      (f) => !f.endsWith("current.md")
    );
    const archivedFiles = fs.existsSync(archiveSprintsDir)
      ? listMdFiles(archiveSprintsDir)
      : [];
    const files = [...activeFiles, ...archivedFiles];
    return files
      .map((file) => {
        const parsed = parseMarkdownFile(file);
        if (!parsed) return null;
        const fm = parsed.frontmatter as Record<string, unknown>;
        return {
          id: (fm.id as string) || path.basename(file, ".md"),
          title: (fm.title as string) || "",
          project: (fm.project as string) || "",
          goal: (fm.goal as string) || "",
          start_date: (fm.start_date as string) || "",
          end_date: (fm.end_date as string) || "",
          status: (fm.status as Sprint["status"]) || "planning",
          capacity: (fm.capacity as number) || 21,
          created_by: (fm.created_by as string) || "",
          okrs: (fm.okrs as string[]) || [],
          acted_by: (fm.acted_by as Sprint["acted_by"]) || [],
        } satisfies Sprint;
      })
      .filter((s): s is Sprint => s !== null);
  });
}

export function getActivity(limit = 50, offset = 0): { items: Activity[]; total: number } {
  const logPath = resolve(PATHS.activityLog);
  if (offset === 0) {
    return parseJsonlFileTail<Activity>(logPath, limit);
  }
  const all = parseJsonlFile<Activity>(logPath);
  all.reverse();
  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
  };
}

export function getAllActivity(): { items: Activity[] } {
  const logPath = resolve(PATHS.activityLog);
  const items = parseJsonlFile<Activity>(logPath);
  items.reverse();
  return { items };
}

export function getConfig(): KanbanConfig | null {
  return parseYamlFile<KanbanConfig>(resolve(PATHS.config));
}

export interface SprintStats {
  taskCount: number;
  totalPoints: number;
  completedPoints: number;
  tasksByStatus: Record<string, number>;
  totalTokens: number;
  tokensByPhase: { backlog: number; todo: number; in_progress: number; review: number };
}

export function computeSprintStats(tasks: Task[]): SprintStats {
  const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const completedPoints = tasks
    .filter((t) => t.status === "done" || t.status === "archived")
    .reduce((sum, t) => sum + (t.story_points || 0), 0);
  const tasksByStatus: Record<string, number> = {};
  for (const t of tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  }
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_used || 0), 0);
  const tokensByPhase = tasks.reduce(
    (acc, t) => {
      if (t.tokens_by_phase) {
        acc.backlog += t.tokens_by_phase.backlog || 0;
        acc.todo += t.tokens_by_phase.todo || 0;
        acc.in_progress += t.tokens_by_phase.in_progress || 0;
        acc.review += t.tokens_by_phase.review || 0;
      }
      return acc;
    },
    { backlog: 0, todo: 0, in_progress: 0, review: 0 }
  );
  return { taskCount: tasks.length, totalPoints, completedPoints, tasksByStatus, totalTokens, tokensByPhase };
}

export function getStats(): Stats {
  const tasks = getAllTasks();
  const stats: Stats = {
    totalTasks: tasks.length,
    byStatus: { backlog: 0, todo: 0, "in-progress": 0, review: 0, done: 0, archived: 0 },
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
    byAgent: {},
    byProject: {},
    totalPoints: 0,
    completedPoints: 0,
    inProgressPoints: 0,
  };

  for (const task of tasks) {
    stats.byStatus[task.status]++;
    stats.byPriority[task.priority]++;

    if (task.assigned_to) {
      stats.byAgent[task.assigned_to] = (stats.byAgent[task.assigned_to] || 0) + 1;
    }

    if (task.project) {
      stats.byProject[task.project] = (stats.byProject[task.project] || 0) + 1;
    }

    const points = task.story_points || 0;
    stats.totalPoints += points;
    if (task.status === "done") stats.completedPoints += points;
    if (task.status === "in-progress") stats.inProgressPoints += points;
  }

  return stats;
}
