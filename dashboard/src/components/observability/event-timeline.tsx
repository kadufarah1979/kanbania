"use client";

import { useEffect, useRef, useState } from "react";
import type { HookEvent } from "@/lib/types";
import { EventRow } from "./event-row";

interface EventTimelineProps {
  events: HookEvent[];
  filterAgent: string;
  filterType: string;
  filterProject: string;
  filterSearch: string;
}

export function EventTimeline({
  events,
  filterAgent,
  filterType,
  filterProject,
  filterSearch,
}: EventTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filtered = events.filter((e) => {
    if (filterAgent && e.agent_id !== filterAgent) return false;
    if (filterType && e.hook_type !== filterType) return false;
    if (filterProject && e.source_app !== filterProject) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const toolName =
        e.tool_name ?? (e.payload?.tool_name as string | undefined) ?? "";
      if (
        !e.agent_id.toLowerCase().includes(q) &&
        !e.hook_type.toLowerCase().includes(q) &&
        !toolName.toLowerCase().includes(q) &&
        !JSON.stringify(e.payload).toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered.length, autoScroll]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        Nenhum evento
        {filterAgent || filterType || filterSearch ? " (filtros ativos)" : ""}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
    >
      {filtered.map((event, i) => (
        <EventRow key={`${event.session_id}-${event.timestamp}-${i}`} event={event} />
      ))}
      <div ref={bottomRef} />

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="fixed bottom-6 right-6 bg-gray-800 border border-gray-600 text-gray-300 text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        >
          ↓ Ir para o fim
        </button>
      )}
    </div>
  );
}
