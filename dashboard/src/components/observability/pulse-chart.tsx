"use client";

import { useEffect, useRef } from "react";
import type { HookEvent } from "@/lib/types";

const BUCKET_SECONDS = 10;
const NUM_BUCKETS = 24; // 4 minutes

interface PulseChartProps {
  events: HookEvent[];
}

export function PulseChart({ events }: PulseChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const now = Date.now();

    // Build buckets
    const buckets: { count: number; byAgent: Record<string, number> }[] = Array.from(
      { length: NUM_BUCKETS },
      () => ({ count: 0, byAgent: {} })
    );

    events.forEach((e) => {
      const age = now - new Date(e.timestamp).getTime();
      const bucketIdx = Math.floor(age / (BUCKET_SECONDS * 1000));
      const idx = NUM_BUCKETS - 1 - bucketIdx;
      if (idx >= 0 && idx < NUM_BUCKETS) {
        buckets[idx].count++;
        buckets[idx].byAgent[e.agent_id] = (buckets[idx].byAgent[e.agent_id] || 0) + 1;
      }
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    const barWidth = width / NUM_BUCKETS;
    const padding = 2;

    ctx.clearRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = Math.round(height * (1 - i / 4));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Agent colors
    const AGENT_COLORS: Record<string, string> = {
      "claude-code": "#f97316",
      codex: "#10b981",
    };

    buckets.forEach((bucket, i) => {
      if (bucket.count === 0) return;
      const barH = Math.max(2, ((bucket.count / maxCount) * (height - 8)));
      const x = i * barWidth + padding;
      const y = height - barH;
      const bw = barWidth - padding * 2;

      // Opacity fades older buckets
      const opacity = 0.3 + 0.7 * (i / NUM_BUCKETS);

      // Stacked bars by agent
      let yOffset = height;
      const agents = Object.entries(bucket.byAgent);
      agents.forEach(([agentId, cnt]) => {
        const segH = (cnt / bucket.count) * barH;
        yOffset -= segH;
        const color = AGENT_COLORS[agentId] || "#6366f1";
        ctx.fillStyle = color + Math.round(opacity * 255).toString(16).padStart(2, "0");
        ctx.fillRect(x, yOffset, bw, segH);
      });

      // Pulse dot on most recent bucket
      if (i === NUM_BUCKETS - 1 && bucket.count > 0) {
        ctx.beginPath();
        ctx.arc(x + bw / 2, y - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.fill();
      }
    });

    // Time labels
    ctx.fillStyle = "rgba(156,163,175,0.6)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    const labelInterval = 6;
    for (let i = 0; i < NUM_BUCKETS; i += labelInterval) {
      const secsAgo = (NUM_BUCKETS - i) * BUCKET_SECONDS;
      const label = secsAgo >= 60 ? `-${Math.floor(secsAgo / 60)}m` : `-${secsAgo}s`;
      ctx.fillText(label, i * barWidth + barWidth / 2, height - 1);
    }
  }, [events]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[72px] block"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
