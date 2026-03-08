import { cn } from "@/lib/utils";
import type { AdminLog } from "@/types/admin";

const actionLabels: Record<string, string> = {
  ban_user: "Banned User",
  unban_user: "Unbanned User",
  auto_unban: "Auto-Unbanned User",
  warn_user: "Warned User",
  resolve_report: "Resolved Report",
  dismiss_report: "Dismissed Report",
  claim_report: "Claimed Report",
  delete_group: "Archived Group",
  change_role: "Changed Role",
  view_conversation: "Viewed Conversation",
  assign_ticket: "Assigned Ticket",
  resolve_ticket: "Resolved Ticket",
  close_ticket: "Closed Ticket",
  reply_ticket: "Replied to Ticket",
};

const actionColors: Record<string, string> = {
  ban_user: "text-destructive",
  unban_user: "text-green-600 dark:text-green-400",
  warn_user: "text-orange-500",
  resolve_report: "text-green-600 dark:text-green-400",
  dismiss_report: "text-muted-foreground",
  delete_group: "text-destructive",
  change_role: "text-blue-600 dark:text-blue-400",
};

interface AdminLogEntryProps {
  log: AdminLog;
}

export default function AdminLogEntry({ log }: AdminLogEntryProps) {
  const label = actionLabels[log.action] ?? log.action;
  const colorClass = actionColors[log.action] ?? "text-foreground";

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", colorClass)}>{label}</span>
          {log.targetType && log.targetId && (
            <span className="text-xs bg-muted/60 px-1.5 py-0.5 rounded-md text-muted-foreground">
              {log.targetType} · {log.targetId.slice(-8)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          by <span className="text-foreground/70 font-medium">{log.adminUsername}</span>
        </p>
        {Object.keys(log.details ?? {}).length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {Object.entries(log.details)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
        {new Date(log.createdAt).toLocaleString()}
      </span>
    </div>
  );
}
