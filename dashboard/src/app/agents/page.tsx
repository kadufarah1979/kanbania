"use client";

import { useMemo, useState } from "react";
import { Trash2, Radio } from "lucide-react";
import { useAllHookEvents } from "@/lib/hooks/use-all-hook-events";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { PulseChart } from "@/components/observability/pulse-chart";
import { EventTimeline } from "@/components/observability/event-timeline";
import type { HookType } from "@/lib/types";

const ALL_HOOK_TYPES: HookType[] = [
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "Stop",
  "SessionStart",
  "SessionEnd",
  "Notification",
  "UserPromptSubmit",
  "SubagentStart",
  "SubagentStop",
  "PreCompact",
  "PermissionRequest",
];

export default function AgentsPage() {
  const { events, clear } = useAllHookEvents();
  const { connected } = useWebSocket();

  const [filterAgent, setFilterAgent] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const agentIds = useMemo(
    () => Array.from(new Set(events.map((e) => e.agent_id))).sort(),
    [events]
  );

  const projectIds = useMemo(
    () => Array.from(new Set(events.map((e) => e.source_app).filter(Boolean))).sort() as string[],
    [events]
  );

  const filteredCount = events.filter((e) => {
    if (filterAgent && e.agent_id !== filterAgent) return false;
    if (filterType && e.hook_type !== filterType) return false;
    if (filterProject && e.source_app !== filterProject) return false;
    return true;
  }).length;

  return (
    // Undo app-shell padding, full viewport height minus header
    <div className="-m-4 md:-m-6 h-[calc(100vh-3.5rem)] flex flex-col bg-gray-950 font-mono text-sm">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-gray-900 shrink-0">
        <span className="font-semibold text-white text-base tracking-tight">
          🔭 Observabilidade
        </span>

        {/* WS status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-400">
            {connected ? "ao vivo" : "offline"}
          </span>
        </div>

        {/* Event count */}
        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
          {filteredCount} / {events.length} eventos
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Clear */}
          <button
            onClick={clear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-red-700"
          >
            <Trash2 className="h-3 w-3" />
            Limpar
          </button>
        </div>
      </div>

      {/* ── Pulse chart ── */}
      <div className="shrink-0 px-3 py-2 border-b border-white/10 bg-gray-900/50">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="h-3 w-3 text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Atividade — últimos 4 min
          </span>
          {/* Agent color legend */}
          <div className="ml-auto flex items-center gap-3">
            {agentIds.map((id) => (
              <div key={id} className="flex items-center gap-1">
                <div
                  className="h-2 w-2 rounded-sm"
                  style={{
                    backgroundColor:
                      id === "claude-code"
                        ? "#f97316"
                        : id === "codex"
                        ? "#10b981"
                        : "#6366f1",
                  }}
                />
                <span className="text-[10px] text-gray-500">{id}</span>
              </div>
            ))}
          </div>
        </div>
        <PulseChart events={events} />
      </div>

      {/* ── Filters ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-gray-900/30">
        {/* Agent filter */}
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
        >
          <option value="">Todos os agentes</option>
          {agentIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        {/* Project filter */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
        >
          <option value="">Todos os projetos</option>
          {projectIds.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
        >
          <option value="">Todos os tipos</option>
          {ALL_HOOK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 buscar..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500 w-48"
        />

        {(filterAgent || filterType || filterProject || filterSearch) && (
          <button
            onClick={() => {
              setFilterAgent("");
              setFilterType("");
              setFilterProject("");
              setFilterSearch("");
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ✕ limpar filtros
          </button>
        )}
      </div>

      {/* ── Event timeline ── */}
      <EventTimeline
        events={events}
        filterAgent={filterAgent}
        filterType={filterType}
        filterProject={filterProject}
        filterSearch={filterSearch}
      />
    </div>
  );
}
