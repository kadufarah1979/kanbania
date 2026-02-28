"use client";

import { useCallback } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { useActivity } from "@/lib/hooks/use-activity";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import type { WSMessage } from "@/lib/types";

export default function ActivityPage() {
  const { items, total, loading, refetch } = useActivity(100);

  const handleWsMessage = useCallback(
    (msg: WSMessage) => {
      if (msg.type !== "file-change") return;
      if (msg.area === "logs") refetch();
    },
    [refetch]
  );

  useWebSocket(handleWsMessage);

  return <ActivityFeed items={items} total={total} loading={loading} />;
}
