"use client";

import { useCallback } from "react";
import { Bot, Loader2, Clock, Eye, Wifi, WifiOff } from "lucide-react";
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
  { icon: typeof Bot; label: string; pulse: boolean; color: string }
> = {
  working: {
    icon: Loader2,
    label: "Trabalhando",
    pulse: true,
    color: "text-green-500",
  },
  reviewing: {
    icon: Eye,
    label: "Revisando",
    pulse: true,
    color: "text-orange-500",
  },
  idle: {
    icon: Clock,
    label: "Aguardando",
    pulse: false,
    color: "text-gray-400",
  },
  waiting: {
    icon: Clock,
    label: "Bloqueado",
    pulse: false,
    color: "text-yellow-500",
  },
  offline: {
    icon: WifiOff,
    label: "Offline",
    pulse: false,
    color: "text-red-500",
  },
};

function AgentCard({ agent, hexColor }: { agent: AgentStatus; hexColor: string }) {
  const config = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(agent.updated_at), {
    addSuffix: true,
    locale: ptBR,
  });
  const cardStyle = {
    backgroundColor: `${hexColor}14`,
    color: hexColor,
    borderColor: `${hexColor}33`,
  };

  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-all"
      style={cardStyle}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Bot className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-sm truncate">{agent.agent}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            config.color,
            config.pulse && agent.status === "working" && "animate-spin"
          )}
        />
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {config.pulse && (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                agent.status === "working" ? "bg-green-400" : "bg-orange-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                agent.status === "working" ? "bg-green-500" : "bg-orange-500"
              )}
            />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 hidden sm:block">
        {agent.task_id && (
          <span className="text-xs font-mono opacity-70 mr-1.5">
            {agent.task_id}
          </span>
        )}
        <span className="text-xs opacity-70 truncate">
          {agent.description}
        </span>
      </div>

      <span className="text-[10px] opacity-50 shrink-0 hidden md:block">
        {timeAgo}
      </span>
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
      if (msg.type !== "file-change") return;
      if (
        msg.area === "board" ||
        msg.area === "logs" ||
        msg.area === "agents"
      ) {
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
          return <AgentCard key={agent.agent} agent={agent} hexColor={hexColor} />;
        })}
      </div>
    </div>
  );
}
