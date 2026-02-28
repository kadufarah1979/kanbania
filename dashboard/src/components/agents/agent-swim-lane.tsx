"use client";

import { useConfig } from "@/lib/hooks/use-config";
import { useHookEvents } from "@/lib/hooks/use-hook-events";
import { EventChip } from "./event-chip";
import type { AgentConfig, HookEvent } from "@/lib/types";

const VISUAL_HOOK_TYPES = new Set(["PreToolUse", "PostToolUse"]);

interface AgentLaneProps {
  agent: AgentConfig;
}

function AgentLane({ agent }: AgentLaneProps) {
  const { events } = useHookEvents(agent.id);
  const visible = events.filter((e: HookEvent) => VISUAL_HOOK_TYPES.has(e.hook_type));

  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="text-xs font-semibold w-24 shrink-0 truncate"
        style={{ color: agent.color || "#9ca3af" }}
      >
        {agent.name || agent.id}
      </span>
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
        {visible.length === 0 ? (
          <span className="text-xs text-gray-600 italic">sem atividade recente</span>
        ) : (
          visible.map((event, i) => <EventChip key={i} event={event} />)
        )}
      </div>
    </div>
  );
}

export function AgentSwimLane() {
  const { config } = useConfig();

  if (!config) return null;

  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Tool Use em Tempo Real
      </h3>
      <div className="space-y-1">
        {config.agents.map((agent) => (
          <AgentLane key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
