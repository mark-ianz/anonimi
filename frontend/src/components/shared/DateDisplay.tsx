import { cn } from "@/lib/utils";

interface DateDisplayProps {
  date: string | Date;
  format?: "relative" | "time" | "date" | "full" | "short";
  className?: string;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date): string {
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function DateDisplay({ date, format = "relative", className }: DateDisplayProps) {
  const d = typeof date === "string" ? new Date(date) : date;

  let text: string;
  switch (format) {
    case "time":
      text = formatTime(d);
      break;
    case "date":
      text = formatDate(d);
      break;
    case "full":
      text = d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      break;
    case "short":
      text = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      break;
    default:
      text = formatRelative(d);
  }

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString()}
      className={cn("text-xs text-muted-foreground", className)}
    >
      {text}
    </time>
  );
}
