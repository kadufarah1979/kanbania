"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { WebSocketContext } from "@/components/providers/websocket-provider";
import type { AgentStatus } from "@/app/api/agents/status/route";

interface UseAgentsOptions {
  project?: string;
}

const FALLBACK_INTERVAL = 15_000;

export function useAgents(options: UseAgentsOptions = {}) {
  const { project } = options;
  const [data, setData] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useContext(WebSocketContext);

  const fetch_ = useCallback(async () => {
    try {
      const params = new URLSearchParams({ _t: String(Date.now()) });
      if (project) params.set("project", project);
      const res = await fetch(`/api/agents/status?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  useEffect(() => {
    if (connected) return;
    const timer = setInterval(fetch_, FALLBACK_INTERVAL);
    return () => clearInterval(timer);
  }, [connected, fetch_]);

  return { data, loading, refetch: fetch_ };
}
