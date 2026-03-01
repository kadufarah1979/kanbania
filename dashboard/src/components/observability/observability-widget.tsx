"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useAllHookEvents } from "@/lib/hooks/use-all-hook-events";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { PulseChart } from "./pulse-chart";

export function ObservabilityWidget() {
  const { events, clear } = useAllHookEvents();
  const { connected } = useWebSocket();

  const agentIds = useMemo(
    () => Array.from(new Set(events.map((e) => e.agent_id))).sort(),
    [events]
  );

  const AGENT_COLORS: Record<string, string> = {
    "claude-code": "#f97316",
    codex: "#10b981",
  };

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900 font-mono text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
        <span className="font-semibold text-white text-sm tracking-tight">
          🔭 Observabilidade
        </span>

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

        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
          {events.length} / {events.length} eventos
        </span>

        <div className="ml-auto flex items-center gap-3">
          {agentIds.map((id) => (
            <div key={id} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: AGENT_COLORS[id] ?? "#6366f1" }}
              />
              <span className="text-[10px] text-gray-500">{id}</span>
            </div>
          ))}
          <button
            onClick={clear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-red-700"
          >
            <Trash2 className="h-3 w-3" />
            Limpar
          </button>
        </div>
      </div>

      {/* Pulse chart */}
      <div className="px-3 py-2 bg-gray-950/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Atividade — últimas 8 horas
          </span>
        </div>
        <PulseChart events={events} />
      </div>
    </div>
  );
}
