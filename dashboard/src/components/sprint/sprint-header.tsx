"use client";

import type { Sprint } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import Link from "next/link";

interface SprintNavigation {
  prevId: string | null;
  nextId: string | null;
  current: number;
  total: number;
}

interface LinkedOkr {
  id: string;
  objective: string;
}

interface SprintHeaderProps {
  sprint: Sprint & { linkedOkrs?: LinkedOkr[] };
  navigation?: SprintNavigation;
}

export function SprintHeader({ sprint, navigation }: SprintHeaderProps) {
  const startDate = parseISO(sprint.start_date);
  const endDate = parseISO(sprint.end_date);
  const today = new Date();
  const totalDays = differenceInDays(endDate, startDate);
  const elapsed = Math.max(0, differenceInDays(today, startDate));
  const remaining = Math.max(0, differenceInDays(endDate, today));

  return (
    <div className="space-y-3">
      {navigation && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/home" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/sprints" className="hover:text-foreground transition-colors">Sprints</Link>
            <span>/</span>
            <span className="text-foreground">{sprint.id}</span>
          </div>
          <div className="flex items-center gap-2">
            {navigation.prevId ? (
              <Link
                href={`/sprints/${navigation.prevId}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground/40 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </span>
            )}
            <span className="text-xs text-muted-foreground px-2">
              {navigation.current} de {navigation.total}
            </span>
            {navigation.nextId ? (
              <Link
                href={`/sprints/${navigation.nextId}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Proximo
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground/40 cursor-not-allowed">
                Proximo
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">{sprint.title}</h2>
        <Badge variant={sprint.status === "active" ? "default" : "secondary"} className="capitalize">
          {sprint.status}
        </Badge>
      </div>

      {sprint.goal && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          {sprint.goal}
        </p>
      )}

      {sprint.linkedOkrs && sprint.linkedOkrs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {sprint.linkedOkrs.map((okr) => (
            <Link key={okr.id} href={`/okr/${okr.id}`}>
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/25 hover:bg-purple-500/20 transition-colors">
                <Target className="h-3 w-3 mr-1" />
                {okr.objective}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          Capacity: {sprint.capacity} pts
        </span>
        <span>Day {Math.min(elapsed, totalDays)} of {totalDays} ({remaining} remaining)</span>
      </div>
    </div>
  );
}
