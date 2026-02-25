"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sprint } from "../types";

export function useSprint() {
  const [data, setData] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/sprint/current", { cache: "no-store" });
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

  return { data, loading, refetch };
}
