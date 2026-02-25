"use client";

import type { Activity } from "@/lib/types";
import { ActivityItem } from "./activity-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon } from "lucide-react";

interface ActivityFeedProps {
  items: Activity[];
  total: number;
  loading: boolean;
}

export function ActivityFeed({ items, total, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <span className="text-sm text-muted-foreground">{total} total entries</span>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="divide-y">
            {items.map((item, i) => (
              <ActivityItem key={`${item.timestamp}-${i}`} activity={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
