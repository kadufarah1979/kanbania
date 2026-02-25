"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, BoardColumn, OKR, Sprint } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Target, Calendar, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, SPRINT_STATUS_STYLE } from "@/lib/constants";
import { format, parseISO } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
  archived: "Finalizadas",
};

const OKR_STATUS_STYLE: Record<string, string> = {
  active: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

type AccordionSection = "okrs" | "sprints" | null;
type SprintTab = "open" | "completed";
type OkrTab = "active" | "completed";

interface ProjectSummaryCardProps {
  project: Project;
  taskCounts?: Record<BoardColumn, number>;
  totalPoints?: number;
  completedPoints?: number;
  okrs?: Pick<OKR, "id" | "objective" | "status" | "period" | "key_results">[];
  sprints?: Pick<Sprint, "id" | "title" | "status" | "start_date" | "end_date" | "capacity">[];
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "dd/MM");
  } catch {
    return dateStr;
  }
}

export function ProjectSummaryCard({
  project,
  taskCounts,
  totalPoints,
  completedPoints,
  okrs,
  sprints,
}: ProjectSummaryCardProps) {
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [sprintTab, setSprintTab] = useState<SprintTab>("open");
  const [okrTab, setOkrTab] = useState<OkrTab>("active");

  const total = taskCounts
    ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
    : 0;

  const doneCount = taskCounts
    ? (taskCounts.done || 0) + (taskCounts.archived || 0)
    : 0;

  const SPRINT_ORDER: Record<string, number> = { active: 0, planning: 1, pending: 2 };
  const pendingSprints = (sprints?.filter((s) => s.status !== "completed" && s.status !== "cancelled") || [])
    .sort((a, b) => (SPRINT_ORDER[a.status] ?? 9) - (SPRINT_ORDER[b.status] ?? 9));
  const completedSprints = sprints?.filter((s) => s.status === "completed") || [];

  const activeOkrs = (okrs?.filter((o) => o.status === "active" || o.status === "pending") || [])
    .sort((a, b) => {
      const aProgress = a.key_results?.reduce((s, kr) => s + kr.current, 0) || 0;
      const bProgress = b.key_results?.reduce((s, kr) => s + kr.current, 0) || 0;
      if (aProgress > 0 && bProgress === 0) return -1;
      if (aProgress === 0 && bProgress > 0) return 1;
      const aStatus = a.status === "active" ? 0 : 1;
      const bStatus = b.status === "active" ? 0 : 1;
      return aStatus - bStatus;
    });
  const completedOkrs = okrs?.filter((o) => o.status === "completed") || [];

  const hasOkrs = okrs && okrs.length > 0;
  const hasSprints = sprints && sprints.length > 0;

  function toggleSection(section: AccordionSection) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpenSection((prev) => (prev === section ? null : section));
    };
  }

  return (
    <Link href={`/board/${project.id}`}>
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{project.name}</CardTitle>
            </div>
            <Badge
              variant={project.status === "active" ? "default" : "secondary"}
              className="capitalize text-xs"
            >
              {project.status}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Tech stack */}
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 5).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.tech_stack.length > 5 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{project.tech_stack.length - 5}
              </Badge>
            )}
          </div>

          {/* Task counts + progress */}
          {taskCounts && total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{total} tasks</span>
                <span>{doneCount} finalizadas</span>
              </div>

              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                {(["archived", "done", "review", "in-progress", "todo", "backlog"] as BoardColumn[]).map(
                  (col) =>
                    taskCounts[col] > 0 && (
                      <div
                        key={col}
                        className={cn("h-full", STATUS_COLORS[col]?.bg.replace("/15", "") || "bg-gray-500")}
                        style={{ width: `${(taskCounts[col] / total) * 100}%` }}
                      />
                    )
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {(["in-progress", "review", "todo", "done", "archived"] as BoardColumn[]).map(
                  (col) =>
                    taskCounts[col] > 0 && (
                      <span
                        key={col}
                        className={cn("text-xs font-medium", STATUS_COLORS[col]?.text || "text-gray-400")}
                      >
                        {taskCounts[col]} {STATUS_LABELS[col] || col}
                      </span>
                    )
                )}
              </div>

              {/* Story points */}
              {totalPoints != null && totalPoints > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{completedPoints || 0}/{totalPoints} pts</span>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden ml-1">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${((completedPoints || 0) / totalPoints) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion: OKRs */}
          {hasOkrs && (
            <div className="pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={toggleSection("okrs")}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    openSection === "okrs" && "rotate-90"
                  )}
                />
                <Target className="h-3 w-3" />
                <span>OKRs</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                  {okrs!.length}
                </Badge>
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  openSection === "okrs" ? "max-h-[500px] opacity-100 mt-1.5" : "max-h-0 opacity-0"
                )}
              >
                {/* Tabs */}
                <div className="flex gap-1 mb-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOkrTab("active"); }}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors",
                      okrTab === "active"
                        ? "border-foreground/30 bg-foreground/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    Ativos ({activeOkrs.length})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOkrTab("completed"); }}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors",
                      okrTab === "completed"
                        ? "border-foreground/30 bg-foreground/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    Concluídos ({completedOkrs.length})
                  </button>
                </div>

                <div className="space-y-1.5">
                  {/* Tab: Ativos */}
                  {okrTab === "active" && (
                    <>
                      {activeOkrs.length === 0 && (
                        <p className="text-[11px] text-muted-foreground py-2 text-center">
                          Nenhum OKR ativo.
                        </p>
                      )}
                      {activeOkrs.slice(0, 10).map((okr) => {
                        const krDone = okr.key_results?.filter((kr) => kr.current >= kr.target).length || 0;
                        const krTotal = okr.key_results?.length || 0;
                        return (
                          <Link
                            key={okr.id}
                            href={`/okr/${okr.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-start gap-2 hover:bg-muted/50 rounded-sm px-1 -mx-1 py-0.5 transition-colors"
                          >
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", OKR_STATUS_STYLE[okr.status] || "")}
                            >
                              {okr.period}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-tight line-clamp-2">{okr.objective}</p>
                              {krTotal > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  KR: {krDone}/{krTotal}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                      {activeOkrs.length > 10 && (
                        <span className="text-[10px] text-muted-foreground pl-1">
                          +{activeOkrs.length - 10} mais
                        </span>
                      )}
                    </>
                  )}

                  {/* Tab: Concluídos */}
                  {okrTab === "completed" && (
                    <>
                      {completedOkrs.length === 0 && (
                        <p className="text-[11px] text-muted-foreground py-2 text-center">
                          Nenhum OKR concluído.
                        </p>
                      )}
                      {completedOkrs.slice(0, 10).map((okr) => {
                        const krDone = okr.key_results?.filter((kr) => kr.current >= kr.target).length || 0;
                        const krTotal = okr.key_results?.length || 0;
                        return (
                          <Link
                            key={okr.id}
                            href={`/okr/${okr.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-start gap-2 hover:bg-muted/50 rounded-sm px-1 -mx-1 py-0.5 transition-colors opacity-60"
                          >
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0 shrink-0 mt-0.5", OKR_STATUS_STYLE[okr.status] || "")}
                            >
                              {okr.period}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-tight line-clamp-2 line-through">{okr.objective}</p>
                              {krTotal > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  KR: {krDone}/{krTotal}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                      {completedOkrs.length > 10 && (
                        <span className="text-[10px] text-muted-foreground pl-1">
                          +{completedOkrs.length - 10} mais
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Accordion: Sprints */}
          {hasSprints && (
            <div className={cn(!hasOkrs && "pt-1 border-t border-border/50")}>
              <button
                type="button"
                onClick={toggleSection("sprints")}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    openSection === "sprints" && "rotate-90"
                  )}
                />
                <Calendar className="h-3 w-3" />
                <span>Sprints</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                  {sprints!.length}
                </Badge>
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  openSection === "sprints" ? "max-h-[500px] opacity-100 mt-1.5" : "max-h-0 opacity-0"
                )}
              >
                {/* Tabs */}
                <div className="flex gap-1 mb-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSprintTab("open"); }}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors",
                      sprintTab === "open"
                        ? "border-foreground/30 bg-foreground/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    Abertas ({pendingSprints.length})
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSprintTab("completed"); }}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-full border transition-colors",
                      sprintTab === "completed"
                        ? "border-foreground/30 bg-foreground/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    Concluídas ({completedSprints.length})
                  </button>
                </div>

                <div className="space-y-1.5">
                  {/* Tab: Abertas */}
                  {sprintTab === "open" && (
                    <>
                      {pendingSprints.length === 0 && (
                        <p className="text-[11px] text-muted-foreground py-2 text-center">
                          Nenhuma sprint aberta.
                        </p>
                      )}
                      {pendingSprints.slice(0, 10).map((sprint) => (
                        <Link
                          key={sprint.id}
                          href={`/board/${project.id}?sprint=${sprint.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:bg-muted/50 rounded-sm px-1 -mx-1 py-0.5 transition-colors"
                        >
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 shrink-0", SPRINT_STATUS_STYLE[sprint.status] || "")}
                          >
                            {sprint.status}
                          </Badge>
                          <span className="text-xs truncate flex-1">{sprint.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDate(sprint.start_date)}
                          </span>
                        </Link>
                      ))}
                      {pendingSprints.length > 10 && (
                        <Link
                          href={`/sprints?project=${project.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1 border-t border-border/30 mt-1"
                        >
                          Ver todas abertas ({pendingSprints.length}) →
                        </Link>
                      )}
                    </>
                  )}

                  {/* Tab: Concluídas */}
                  {sprintTab === "completed" && (
                    <>
                      {completedSprints.length === 0 && (
                        <p className="text-[11px] text-muted-foreground py-2 text-center">
                          Nenhuma sprint concluída.
                        </p>
                      )}
                      {completedSprints.slice(0, 10).map((sprint) => (
                        <Link
                          key={sprint.id}
                          href={`/board/${project.id}?sprint=${sprint.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:bg-muted/50 rounded-sm px-1 -mx-1 py-0.5 transition-colors opacity-60"
                        >
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 shrink-0", SPRINT_STATUS_STYLE[sprint.status] || "")}
                          >
                            {sprint.status}
                          </Badge>
                          <span className="text-xs truncate flex-1 line-through">{sprint.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDate(sprint.start_date)}
                          </span>
                        </Link>
                      ))}
                      {completedSprints.length > 10 && (
                        <Link
                          href={`/sprints?project=${project.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1 border-t border-border/30 mt-1"
                        >
                          Ver todas concluídas ({completedSprints.length}) →
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
