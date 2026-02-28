"use client";

import { useState } from "react";
import type { HookEvent } from "@/lib/types";

const HOOK_EMOJI: Record<string, string> = {
  PreToolUse: "🔧",
  PostToolUse: "✅",
  PostToolUseFailure: "❌",
  Stop: "🛑",
  SessionStart: "🚀",
  SessionEnd: "🏁",
  Notification: "🔔",
  UserPromptSubmit: "💬",
  SubagentStart: "🟢",
  SubagentStop: "👥",
  PreCompact: "📦",
  PermissionRequest: "🔐",
};

const TOOL_EMOJI: Record<string, string> = {
  Bash: "💻",
  Read: "📖",
  Write: "✍️",
  Edit: "✏️",
  Glob: "🔍",
  Grep: "🔎",
  Task: "🤖",
  WebFetch: "🌐",
  WebSearch: "🔎",
  TodoWrite: "📝",
};

const AGENT_COLORS: Record<string, string> = {
  "claude-code": "#f97316",
  codex: "#10b981",
};

const SESSION_PALETTE = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#84cc16",
  "#f472b6",
];

function hashColor(str: string): string {
  if (!str) return "#6b7280";
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return SESSION_PALETTE[Math.abs(h) % SESSION_PALETTE.length];
}

function formatTime(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toolSummary(payload: Record<string, unknown>): string | null {
  const input = payload.tool_input as Record<string, unknown> | undefined;
  if (!input) return null;

  if (input.command) return String(input.command).slice(0, 120);
  if (input.file_path) return String(input.file_path);
  if (input.pattern) return String(input.pattern);
  if (input.query) return String(input.query);
  if (input.url) return String(input.url);

  const entries = Object.entries(input);
  if (entries.length === 0) return null;
  return entries
    .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
    .join(" · ")
    .slice(0, 120);
}

interface EventRowProps {
  event: HookEvent;
}

export function EventRow({ event }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);

  const agentColor = AGENT_COLORS[event.agent_id] || hashColor(event.agent_id);
  const sesColor = hashColor(event.session_id);
  const hookEmoji = HOOK_EMOJI[event.hook_type] ?? "⚡";
  const toolName =
    event.tool_name ?? (event.payload?.tool_name as string | undefined);
  const toolEmoji = toolName ? (TOOL_EMOJI[toolName] ?? "⚡") : "";
  const shortSession = event.session_id ? event.session_id.slice(0, 8) : "—";
  const summary = toolSummary(event.payload);
  const isFailure = event.hook_type === "PostToolUseFailure";

  return (
    <div
      className={`flex group cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/5 ${isFailure && event.hook_type !== "Stop" ? "bg-red-950/20" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Left colored bars */}
      <div className="w-[3px] shrink-0" style={{ backgroundColor: agentColor }} />
      <div className="w-[2px] shrink-0 mr-3" style={{ backgroundColor: sesColor }} />

      {/* Main content */}
      <div className="flex-1 py-2 pr-4 min-w-0">
        {/* Top row: badges + timestamp */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Agent badge */}
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none"
            style={{
              color: agentColor,
              borderColor: agentColor + "88",
              backgroundColor: agentColor + "22",
            }}
          >
            {event.agent_id}
          </span>

          {/* Session badge */}
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border leading-none"
            style={{
              color: sesColor,
              borderColor: sesColor + "66",
              backgroundColor: sesColor + "11",
            }}
          >
            {shortSession}
          </span>

          {/* Hook type */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-200 leading-none">
            {hookEmoji} {event.hook_type}
          </span>

          {/* Tool name */}
          {toolName && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none"
              style={{
                color: agentColor + "cc",
                borderColor: agentColor + "44",
                backgroundColor: agentColor + "11",
              }}
            >
              {toolEmoji} {toolName}
            </span>
          )}

          {/* Source app */}
          {event.source_app && (
            <span className="text-[10px] text-gray-600 leading-none">
              {event.source_app}
            </span>
          )}

          {/* Timestamp — push right */}
          <span className="ml-auto text-[10px] text-gray-600 shrink-0 tabular-nums">
            {formatTime(event.timestamp)}
          </span>
        </div>

        {/* Tool input summary */}
        {summary && (
          <p className="mt-1 text-[11px] text-gray-400 font-mono truncate leading-tight">
            {summary}
          </p>
        )}

        {/* Stop: show last_message preview */}
        {event.hook_type === "Stop" &&
          typeof event.payload.last_message === "string" && (
            <p className="mt-1 text-[11px] text-gray-500 truncate leading-tight italic">
              {event.payload.last_message.slice(0, 120)}
            </p>
          )}

        {/* Expanded payload */}
        {expanded && (
          <pre className="mt-2 p-2 rounded text-[10px] text-gray-300 overflow-x-auto max-h-48 overflow-y-auto border border-white/10 bg-black/40">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
