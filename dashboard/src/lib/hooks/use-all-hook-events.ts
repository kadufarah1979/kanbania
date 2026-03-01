"use client";

import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import type { HookEvent, WSMessage } from "../types";

const MAX_EVENTS = 2000;

export function useAllHookEvents(): {
  events: HookEvent[];
  clear: () => void;
} {
  const [events, setEvents] = useState<HookEvent[]>([]);

  useEffect(() => {
    fetch("/api/events/recent")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events.slice(-MAX_EVENTS));
        }
      })
      .catch(() => {});
  }, []);

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type !== "hook-event") return;

    const payload = msg.payload as Record<string, unknown> | undefined;
    const event: HookEvent = {
      agent_id: msg.agent_id,
      session_id: msg.session_id,
      hook_type: msg.hook_type,
      tool_name: msg.tool_name ?? (payload?.tool_name as string | undefined),
      source_app: (msg as unknown as Record<string, unknown>).source_app as string | undefined,
      timestamp: msg.timestamp,
      payload: msg.payload,
    };

    setEvents((prev) => {
      const updated = [...prev, event];
      return updated.length > MAX_EVENTS ? updated.slice(-MAX_EVENTS) : updated;
    });
  }, []);

  useWebSocket(handleMessage);

  const clear = useCallback(() => setEvents([]), []);

  return { events, clear };
}
