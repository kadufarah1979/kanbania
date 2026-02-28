"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";
import type { HookEvent, WSMessage } from "../types";

const MAX_EVENTS = 50;

export function useHookEvents(agentId?: string): { events: HookEvent[] } {
  const [events, setEvents] = useState<HookEvent[]>([]);

  const handleMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type !== "hook-event") return;
      if (agentId && msg.agent_id !== agentId) return;

      const event: HookEvent = {
        agent_id: msg.agent_id,
        session_id: msg.session_id,
        hook_type: msg.hook_type,
        tool_name: msg.tool_name,
        timestamp: msg.timestamp,
        payload: msg.payload,
      };

      setEvents((prev) => {
        const updated = [...prev, event];
        return updated.length > MAX_EVENTS ? updated.slice(-MAX_EVENTS) : updated;
      });
    },
    [agentId]
  );

  useWebSocket(handleMessage);

  return { events };
}
