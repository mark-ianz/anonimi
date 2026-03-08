"use client";

import { useMemo } from "react";
import type { AnalyticsTimeSeries } from "@/types/admin";

interface AnalyticsChartProps {
  data: AnalyticsTimeSeries[];
  label: string;
  color?: string;
  height?: number;
}

export default function AnalyticsChart({
  data,
  label,
  color = "hsl(var(--primary))",
  height = 120,
}: AnalyticsChartProps) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const points = useMemo(() => {
    if (data.length === 0) return "";
    const w = 400;
    const h = height;
    const padX = 0;
    const padY = 4;
    return data
      .map((d, i) => {
        const x = padX + (i / (data.length - 1 || 1)) * (w - padX * 2);
        const y = h - padY - (d.value / max) * (h - padY * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, max, height]);

  const areaPoints = useMemo(() => {
    if (!points) return "";
    const firstX = 0;
    const lastX = 400;
    return `${firstX},${height} ${points} ${lastX},${height}`;
  }, [points, height]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted/30 border border-border/20 rounded-xl text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="relative overflow-hidden rounded-xl bg-muted/20 border border-border/20" style={{ height }}>
        <svg
          viewBox={`0 0 400 ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Area */}
          <polygon
            points={areaPoints}
            fill={`url(#gradient-${label})`}
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Max label */}
        <span className="absolute top-1.5 left-2 text-[9px] text-muted-foreground tabular-nums">
          {max.toLocaleString()}
        </span>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between px-0.5">
        <span className="text-[10px] text-muted-foreground">
          {data[0]?.date ? new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {data[data.length - 1]?.date
            ? new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : ""}
        </span>
      </div>
    </div>
  );
}
