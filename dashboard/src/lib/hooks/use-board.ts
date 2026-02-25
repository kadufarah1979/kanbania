"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { WebSocketContext } from "@/components/providers/websocket-provider";
import type { BoardData } from "../types";

const empty: BoardData = { backlog: [], todo: [], "in-progress": [], review: [], done: [], archived: [] };
const FALLBACK_INTERVAL = 15_000;

export function useBoard() {
  const [data, setData] = useState<BoardData>(empty);
  const [loading, setLoading] = useState(true);
  const { connected } = useContext(WebSocketContext);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/board?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (connected) return;
    const timer = setInterval(refetch, FALLBACK_INTERVAL);
    return () => clearInterval(timer);
  }, [connected, refetch]);

  return { data, loading, refetch };
}
