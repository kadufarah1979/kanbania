"use client";

import type { Activity } from "@/lib/types";
import { AGENT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  PlusCircle,
  ArrowRight,
  Edit,
  UserCheck,
  UserX,
  MessageSquare,
  CheckCircle,
  Trash2,
  Activity as ActivityIcon,
} from "lucide-react";

const actionIcons: Record<string, React.ElementType> = {
  create: PlusCircle,
  move: ArrowRight,
  update: Edit,
  claim: UserCheck,
  release: UserX,
  comment: MessageSquare,
  complete: CheckCircle,
  delete: Trash2,
};

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = actionIcons[activity.action] || ActivityIcon;

  let formattedDate = activity.timestamp;
  try {
    formattedDate = format(parseISO(activity.timestamp), "MMM d, HH:mm");
  } catch {
    // keep original
  }

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="mt-0.5 p-1.5 rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded border", AGENT_COLORS[activity.agent] || "")}>
            {activity.agent}
          </span>
          <span className="font-medium capitalize">{activity.action}</span>
          <span className="text-muted-foreground font-mono text-xs">{activity.entity_id}</span>
        </div>
        {activity.details && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.details}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formattedDate}</span>
    </div>
  );
}
