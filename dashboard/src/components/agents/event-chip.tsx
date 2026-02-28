"use client";

import type { HookEvent, HookType } from "@/lib/types";

const ICON_MAP: Record<string, string> = {
  Bash: "⬛",
  Read: "📄",
  Write: "✏️",
  Edit: "🖊️",
  Glob: "🔍",
};

const COLOR_MAP: Record<HookType, string> = {
  PostToolUse: "bg-green-900/60 text-green-300 border-green-700",
  PreToolUse: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
  SessionStart: "bg-gray-800/60 text-gray-400 border-gray-600",
  SessionEnd: "bg-gray-800/60 text-gray-400 border-gray-600",
  Stop: "bg-red-900/60 text-red-300 border-red-700",
  Notification: "bg-blue-900/60 text-blue-300 border-blue-700",
};

function relativeTime(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

interface EventChipProps {
  event: HookEvent;
}

export function EventChip({ event }: EventChipProps) {
  const icon = event.tool_name ? (ICON_MAP[event.tool_name] ?? "⚡") : "⚡";
  const color = COLOR_MAP[event.hook_type] ?? "bg-gray-800/60 text-gray-400 border-gray-600";
  const label = event.tool_name ?? event.hook_type;
  const time = relativeTime(event.timestamp);

  const tooltip = [
    `Type: ${event.hook_type}`,
    event.tool_name ? `Tool: ${event.tool_name}` : null,
    `Agent: ${event.agent_id}`,
    `Time: ${event.timestamp}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-0.5 px-1 border rounded text-[10px] leading-none h-6 shrink-0 ${color}`}
    >
      <span>{icon}</span>
      <span className="max-w-[60px] truncate">{label}</span>
      <span className="opacity-60">{time}</span>
    </span>
  );
}
