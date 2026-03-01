"use client";

import { useCallback } from "react";
import { Bot, Loader2, Clock, Eye, Wifi, WifiOff, Zap } from "lucide-react";
import { useAgents } from "@/lib/hooks/use-agents";
import { useConfig } from "@/lib/hooks/use-config";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { DEFAULT_AGENT_HEX_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { WSMessage } from "@/lib/types";
import type { AgentStatus } from "@/app/api/agents/status/route";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG: Record<
  AgentStatus["status"],
  { icon: typeof Bot; label: string; color: string; dotColor: string | null; spin: boolean }
> = {
  active: {
    icon: Zap,
    label: "Ativo",
    color: "text-green-400",
    dotColor: "bg-green-400",
    spin: false,
  },
  working: {
    icon: Loader2,
    label: "Trabalhando",
    color: "text-green-500",
    dotColor: "bg-green-500",
    spin: true,
  },
  reviewing: {
    icon: Eye,
    label: "Revisando",
    color: "text-orange-500",
    dotColor: "bg-orange-400",
    spin: false,
  },
  queued: {
    icon: Clock,
    label: "Na fila",
    color: "text-yellow-500",
    dotColor: null,
    spin: false,
  },
  idle: {
    icon: Clock,
    label: "Aguardando",
    color: "text-gray-400",
    dotColor: null,
    spin: false,
  },
  offline: {
    icon: WifiOff,
    label: "Offline",
    color: "text-red-500",
    dotColor: null,
    spin: false,
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-gray-500 text-white",
};

function formatLastEvent(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60_000) return "< 1 min";
    return formatDistanceToNow(new Date(ts), { locale: ptBR });
  } catch {
    return "?";
  }
}

function AgentCard({
  agent,
  hexColor,
}: {
  agent: AgentStatus;
  hexColor: string;
}) {
  const config = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const Icon = config.icon;
  const priority = agent.task_priority ?? undefined;
  const lastEvent = formatLastEvent(agent.updated_at);
  const cardStyle = {
    backgroundColor: `${hexColor}14`,
    color: hexColor,
    borderColor: `${hexColor}33`,
  };

  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 transition-all"
      style={cardStyle}
    >
      {/* Row 1: agent name + status badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-4 w-4 shrink-0" />
          <span className="font-semibold text-sm truncate">{agent.agent}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Icon
            className={cn(
              "h-3.5 w-3.5",
              config.color,
              config.spin && "animate-spin"
            )}
          />
          <span className={cn("text-xs font-medium", config.color)}>
            {config.label}
          </span>
          {config.dotColor && (
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  config.dotColor
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  config.dotColor
                )}
              />
            </span>
          )}
        </div>
      </div>

      {/* Row 2: queue depth or task info */}
      {agent.queue_depth > 0 && agent.status !== "active" && agent.status !== "working" && agent.status !== "reviewing" && (
        <div className="text-xs opacity-70">
          {agent.queue_depth} {agent.queue_depth === 1 ? "task" : "tasks"} na fila
          {agent.task_id && (
            <span className="ml-1 opacity-60">· próxima: <span className="font-mono">{agent.task_id}</span></span>
          )}
          {priority && PRIORITY_COLORS[priority] && (
            <span className={cn("ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold", PRIORITY_COLORS[priority])}>
              {priority}
            </span>
          )}
        </div>
      )}

      {/* Row 2b: task description for active/working/reviewing */}
      {(agent.status === "active" || agent.status === "working" || agent.status === "reviewing") && agent.task_id && (
        <div className="text-xs opacity-70 truncate">
          <span className="font-mono mr-1.5">{agent.task_id}</span>
          {priority && PRIORITY_COLORS[priority] && (
            <span className={cn("mr-1.5 rounded px-1 py-0.5 text-[9px] font-bold", PRIORITY_COLORS[priority])}>
              {priority}
            </span>
          )}
          <span className="truncate">{agent.description}</span>
        </div>
      )}

      {/* Queued: show task description too */}
      {agent.status === "queued" && agent.task_id && (
        <div className="text-xs opacity-60 truncate">
          <span className="font-mono mr-1.5">{agent.task_id}</span>
          <span className="truncate">{agent.description}</span>
        </div>
      )}

      {/* Row 3: last event */}
      <div className="text-[10px] opacity-50">
        Último evento: {lastEvent} atrás
      </div>
    </div>
  );
}

interface AgentStatusBarProps {
  project?: string;
}

export function AgentStatusBar({ project }: AgentStatusBarProps) {
  const { data: agents, refetch } = useAgents({ project });
  const { agents: configAgents } = useConfig();

  const handleWs = useCallback(
    (msg: WSMessage) => {
      if (msg.type === "hook-event") {
        refetch();
        return;
      }
      if (msg.type === "file-change" && (msg.area === "board" || msg.area === "logs" || msg.area === "agents")) {
        refetch();
      }
    },
    [refetch]
  );

  useWebSocket(handleWs);

  if (!agents.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        <Wifi className="h-3 w-3" />
        Agentes em tempo real
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {agents.map((agent) => {
          const agentCfg = configAgents.find((a) => a.id === agent.agent);
          const hexColor = agentCfg?.color ?? DEFAULT_AGENT_HEX_COLOR;
          return (
            <AgentCard
              key={agent.agent}
              agent={agent}
              hexColor={hexColor}
            />
          );
        })}
      </div>
    </div>
  );
}
