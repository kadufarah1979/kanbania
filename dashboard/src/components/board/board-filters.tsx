"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, Priority } from "@/lib/types";
import { useMemo } from "react";

interface BoardFiltersProps {
  tasks: Task[];
  filters: {
    project: string;
    priority: string;
    agent: string;
    label: string;
  };
  onChange: (filters: BoardFiltersProps["filters"]) => void;
}

export function BoardFilters({ tasks, filters, onChange }: BoardFiltersProps) {
  const options = useMemo(() => {
    const projects = new Set<string>();
    const agents = new Set<string>();
    const labels = new Set<string>();

    for (const t of tasks) {
      if (t.project) projects.add(t.project);
      if (t.assigned_to) agents.add(t.assigned_to);
      t.labels.forEach((l) => labels.add(l));
    }

    return {
      projects: Array.from(projects).sort(),
      agents: Array.from(agents).sort(),
      labels: Array.from(labels).sort(),
    };
  }, [tasks]);

  const set = (key: keyof typeof filters, value: string) => {
    onChange({ ...filters, [key]: value === "all" ? "" : value });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={filters.project || "all"} onValueChange={(v) => set("project", v)}>
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          {options.projects.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority || "all"} onValueChange={(v) => set("priority", v)}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {(["critical", "high", "medium", "low"] as Priority[]).map((p) => (
            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.agent || "all"} onValueChange={(v) => set("agent", v)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All agents</SelectItem>
          {options.agents.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.label || "all"} onValueChange={(v) => set("label", v)}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All labels</SelectItem>
          {options.labels.map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
