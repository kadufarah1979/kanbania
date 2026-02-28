"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { SprintHeader } from "@/components/sprint/sprint-header";
import { SprintProgress } from "@/components/sprint/sprint-progress";
import { SprintTasks } from "@/components/sprint/sprint-tasks";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import type { Sprint, WSMessage } from "@/lib/types";

interface SprintsListData {
  sprints: { id: string }[];
}

export default function SprintByIdPage() {
  const params = useParams<{ id: string }>();
  const sprintId = params.id;

  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [sprintIds, setSprintIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sprintRes, listRes] = await Promise.all([
        fetch(`/api/sprint/${sprintId}`, { cache: "no-store" }),
        fetch(`/api/sprints?_t=${Date.now()}`, { cache: "no-store" }),
      ]);

      if (sprintRes.ok) {
        setSprint(await sprintRes.json());
      } else {
        setSprint(null);
      }

      if (listRes.ok) {
        const data: SprintsListData = await listRes.json();
        setSprintIds(data.sprints.map((s) => s.id));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type !== "file-change") return;
      if (msg.area === "board" || msg.area === "sprints") fetchData();
    },
    [fetchData]
  );

  useWebSocket(handleWsMessage);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sprint nao encontrado</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            O sprint &quot;{sprintId}&quot; nao foi encontrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = sprintIds.indexOf(sprintId);
  const navigation = currentIndex >= 0
    ? {
        prevId: currentIndex < sprintIds.length - 1 ? sprintIds[currentIndex + 1] : null,
        nextId: currentIndex > 0 ? sprintIds[currentIndex - 1] : null,
        current: sprintIds.length - currentIndex,
        total: sprintIds.length,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <SprintHeader sprint={sprint} navigation={navigation} />
      <SprintProgress tasks={sprint.tasks || []} capacity={sprint.capacity} />
      <SprintTasks tasks={sprint.tasks || []} />
    </div>
  );
}
