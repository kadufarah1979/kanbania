/**
 * config-reader.ts — Server-side config loader for kanbania dashboard.
 *
 * Reads config.yaml from KANBAN_ROOT and deep-merges config.local.yaml on top.
 * Provides typed access to the full system configuration.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { KANBAN_ROOT } from "@/lib/constants";
import type { KanbanConfig, AgentConfig } from "@/lib/types";

const CONFIG_PATH = path.join(KANBAN_ROOT, "config.yaml");
const CONFIG_LOCAL_PATH = path.join(KANBAN_ROOT, "config.local.yaml");

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 10_000;
let _cached: { config: KanbanConfig; ts: number } | null = null;

// ── Deep merge ────────────────────────────────────────────────────────────────

type PlainObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is PlainObject {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base: PlainObject, override: PlainObject): PlainObject {
  const result: PlainObject = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}

// ── Default config (fallback when config.yaml is absent) ─────────────────────

const DEFAULT_CONFIG: KanbanConfig = {
  system: { name: "Kanbania", language: "en" },
  owner: { name: "user", timezone: "UTC" },
  agents: [
    {
      id: "claude-code",
      name: "Claude Code",
      provider: "anthropic",
      role: "implementer",
      color: "#a855f7",
      exec_command: null,
      wip_limit: 2,
    },
  ],
  sprint: { duration_days: 14, default_capacity: 21, naming_pattern: "sprint-NNN" },
  board: {
    columns: [
      { id: "backlog", name: "Backlog", description: "" },
      { id: "todo", name: "To Do", description: "" },
      { id: "in-progress", name: "In Progress", description: "" },
      { id: "review", name: "Review", description: "" },
      { id: "done", name: "Done", description: "" },
    ],
  },
  priorities: [
    { id: "critical", name: "Critical", order: 1 },
    { id: "high", name: "High", order: 2 },
    { id: "medium", name: "Medium", order: 3 },
    { id: "low", name: "Low", order: 4 },
  ],
  labels: ["bug", "feature", "refactor", "docs", "infra", "security", "testing"],
};

// ── Loader ────────────────────────────────────────────────────────────────────

function loadYaml<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return yaml.load(raw) as T;
  } catch {
    return null;
  }
}

function loadConfig(): KanbanConfig {
  const base = loadYaml<KanbanConfig>(CONFIG_PATH) ?? DEFAULT_CONFIG;
  const local = loadYaml<PlainObject>(CONFIG_LOCAL_PATH);
  if (!local) return base;
  return deepMerge(base as unknown as PlainObject, local) as unknown as KanbanConfig;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getKanbanConfig(): KanbanConfig {
  if (_cached && Date.now() - _cached.ts < CACHE_TTL_MS) {
    return _cached.config;
  }
  const config = loadConfig();
  _cached = { config, ts: Date.now() };
  return config;
}

export function invalidateConfigCache(): void {
  _cached = null;
}

/** Returns column ids in order from config */
export function getColumnIds(config: KanbanConfig): string[] {
  return config.board.columns.map((c) => c.id);
}

/** Returns all agent configs */
export function getAgents(config: KanbanConfig): AgentConfig[] {
  return config.agents ?? [];
}

/** Returns reviewer agents (role = reviewer | both) */
export function getReviewerAgents(config: KanbanConfig): AgentConfig[] {
  return config.agents.filter((a) => a.role === "reviewer" || a.role === "both");
}

/** Returns implementer agents (role = implementer | both) */
export function getImplementerAgents(config: KanbanConfig): AgentConfig[] {
  return config.agents.filter((a) => a.role === "implementer" || a.role === "both");
}

/** Builds a map of agentId -> hex color from config */
export function getAgentHexColors(config: KanbanConfig): Record<string, string> {
  return Object.fromEntries(config.agents.map((a) => [a.id, a.color]));
}

/** System display name */
export function getSystemName(config: KanbanConfig): string {
  return config.system?.name ?? "Kanbania";
}
