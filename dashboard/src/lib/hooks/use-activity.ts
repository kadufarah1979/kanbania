"use client";

import { useState, useEffect, useCallback } from "react";
import type { Activity } from "../types";

export function useActivity(limit = 50) {
  const [items, setItems] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?limit=${limit}&offset=0`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setItems(json.items);
        setTotal(json.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, total, loading, refetch };
}
