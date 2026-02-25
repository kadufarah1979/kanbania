"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { SPRINT_STATUS_STYLE } from "@/lib/constants";
import type { Sprint } from "@/lib/types";

interface LinkedOkr {
  id: string;
  objective: string;
}

export interface SprintNavigation {
  prevId: string | null;
  nextId: string | null;
  current: number;
  total: number;
  projectSlug: string;
}

interface SprintBannerProps {
  sprint: (Sprint & { linkedOkrs?: LinkedOkr[] }) | null;
  navigation?: SprintNavigation;
  label?: string;
}

function formatDateRange(start: string, end: string): string {
  try {
    return `${format(parseISO(start), "dd/MM")} → ${format(parseISO(end), "dd/MM")}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export function SprintBanner({ sprint, navigation, label }: SprintBannerProps) {
  if (!sprint) return null;

  const dateRange = formatDateRange(sprint.start_date, sprint.end_date);

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold">
            {label ? `${label}: ` : ""}
            {sprint.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {navigation && (
            <div className="flex items-center gap-1 mr-2">
              {navigation.prevId ? (
                <Link
                  href={`/board/${navigation.projectSlug}?sprint=${navigation.prevId}`}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Link>
              ) : (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground/40 cursor-not-allowed">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </span>
              )}
              <span className="text-[10px] text-muted-foreground px-1.5">
                {navigation.current}/{navigation.total}
              </span>
              {navigation.nextId ? (
                <Link
                  href={`/board/${navigation.projectSlug}?sprint=${navigation.nextId}`}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Proximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground/40 cursor-not-allowed">
                  Proximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          )}
          <Badge
            variant="outline"
            className={`text-xs capitalize ${SPRINT_STATUS_STYLE[sprint.status] || ""}`}
          >
            {sprint.status}
          </Badge>
        </div>
      </div>
      {sprint.goal && (
        <p className="text-xs text-muted-foreground leading-relaxed">{sprint.goal}</p>
      )}
      {sprint.linkedOkrs && sprint.linkedOkrs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {sprint.linkedOkrs.map((okr) => (
            <Link key={okr.id} href={`/okr/${okr.id}`}>
              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/25 hover:bg-purple-500/20 transition-colors">
                <Target className="h-2.5 w-2.5 mr-1" />
                {okr.objective}
              </Badge>
            </Link>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateRange}
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {sprint.capacity} pts
        </span>
      </div>
    </div>
  );
}
