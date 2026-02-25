"use client";

import { useState, useEffect } from "react";
import type { KanbanConfig } from "@/lib/types";

export function useConfig() {
  const [config, setConfig] = useState<KanbanConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: KanbanConfig) => {
        if (!cancelled) {
          setConfig(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return {
    config,
    isLoading,
    error,
    columnIds: config?.board.columns.map((c: { id: string }) => c.id) ?? [],
    agents: config?.agents ?? [],
    systemName: config?.system?.name ?? "Kanbania",
  };
}
