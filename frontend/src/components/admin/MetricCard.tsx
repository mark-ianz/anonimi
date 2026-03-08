import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "default" | "danger" | "warning" | "success" | "info";
  loading?: boolean;
}

const colorClasses = {
  default: "bg-muted/50 text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-orange-500/10 text-orange-500",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trendValue,
  color = "default",
  loading = false,
}: MetricCardProps) {
  return (
    <div className="bg-background border border-border/30 rounded-2xl p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold font-display tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
      {trendValue && (
        <p className="text-xs text-muted-foreground">{trendValue}</p>
      )}
    </div>
  );
}
