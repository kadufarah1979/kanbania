import type { BoardColumn, Priority } from "./types";

export const KANBAN_ROOT = process.env.KANBAN_ROOT || "";

/** Default board columns — overridden at runtime by config.yaml via useConfig() */
export const BOARD_COLUMNS: { id: BoardColumn; name: string; color: string }[] = [
  { id: "backlog", name: "Backlog", color: "text-gray-500" },
  { id: "todo", name: "To Do", color: "text-blue-500" },
  { id: "in-progress", name: "In Progress", color: "text-yellow-500" },
  { id: "review", name: "Review", color: "text-orange-500" },
  { id: "done", name: "Done", color: "text-green-500" },
  { id: "archived", name: "Archived", color: "text-emerald-600" },
];

export const COLUMN_BG: Record<BoardColumn, string> = {
  backlog: "bg-gray-500/10 border-gray-500/20",
  todo: "bg-blue-500/10 border-blue-500/20",
  "in-progress": "bg-yellow-500/10 border-yellow-500/20",
  review: "bg-orange-500/10 border-orange-500/20",
  done: "bg-green-500/10 border-green-500/20",
  archived: "bg-emerald-600/10 border-emerald-600/20",
};

export const COLUMN_HEADER_COLOR: Record<BoardColumn, string> = {
  backlog: "text-gray-500",
  todo: "text-blue-500",
  "in-progress": "text-yellow-500",
  review: "text-orange-500",
  done: "text-green-500",
  archived: "text-emerald-600",
};

export const PRIORITY_COLORS: Record<Priority, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: "border-l-red-500", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
  high: { border: "border-l-orange-500", bg: "bg-orange-500/10", text: "text-orange-500", dot: "bg-orange-500" },
  medium: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-500", dot: "bg-yellow-500" },
  low: { border: "border-l-gray-400", bg: "bg-gray-400/10", text: "text-gray-400", dot: "bg-gray-400" },
};

/**
 * Fallback agent badge colors (Tailwind classes) for agents not in config.
 * Agents from config.yaml get colors derived from their `color` hex field.
 */
export const AGENT_COLORS: Record<string, string> = {};

/** Fallback hex colors for agents not in config (used by Recharts) */
export const AGENT_HEX_COLORS: Record<string, string> = {};

/** Default hex color for agents with no configured color */
export const DEFAULT_AGENT_HEX_COLOR = "#6b7280";

/**
 * Builds inline style for an agent badge given a hex color from config.
 * Use this when agent colors come from config rather than static AGENT_COLORS.
 */
export function agentColorStyle(hexColor: string): React.CSSProperties {
  return {
    backgroundColor: `${hexColor}20`,
    color: hexColor,
    borderColor: `${hexColor}40`,
  };
}

// React import needed for CSSProperties type
import type React from "react";

/** Hex colors for status in charts */
export const STATUS_HEX_COLORS: Record<string, string> = {
  backlog: "#6b7280",
  todo: "#3b82f6",
  "in-progress": "#eab308",
  review: "#f97316",
  done: "#22c55e",
  archived: "#10b981",
};

/** Sprint status badge styles (Tailwind) */
export const SPRINT_STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  closed: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  completed: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  planning: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

/** Status colors for task distribution (Tailwind bg) */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  backlog: { bg: "bg-gray-500/15", text: "text-gray-400" },
  todo: { bg: "bg-blue-500/15", text: "text-blue-400" },
  "in-progress": { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  review: { bg: "bg-orange-500/15", text: "text-orange-400" },
  done: { bg: "bg-green-500/15", text: "text-green-400" },
  archived: { bg: "bg-emerald-600/15", text: "text-emerald-400" },
};

export const PATHS = {
  board: "board",
  backlog: "board/backlog",
  todo: "board/todo",
  "in-progress": "board/in-progress",
  review: "board/review",
  done: "board/done",
  sprints: "sprints",
  projects: "projects",
  okrs: "okrs",
  logs: "logs",
  templates: "templates",
  config: "config.yaml",
  archived: "archive/board/done",
  activityLog: "logs/activity.jsonl",
};
