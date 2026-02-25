"use client";

import { useCallback } from "react";
import { SprintHeader } from "@/components/sprint/sprint-header";
import { SprintProgress } from "@/components/sprint/sprint-progress";
import { SprintTasks } from "@/components/sprint/sprint-tasks";
import { useSprint } from "@/lib/hooks/use-sprint";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import type { WSMessage } from "@/lib/types";

export default function SprintPage() {
  const { data: sprint, loading, refetch } = useSprint();

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.area === "board" || msg.area === "sprints") refetch();
    },
    [refetch]
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

  return (
    <div className="space-y-6">
      {!sprint ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Sprint</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              There is no active sprint at the moment. Create a sprint file in the sprints/ directory
              and update sprints/current.md to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SprintHeader sprint={sprint} />
          <SprintProgress tasks={sprint.tasks || []} capacity={sprint.capacity} />
          <SprintTasks tasks={sprint.tasks || []} />
        </>
      )}
    </div>
  );
}
