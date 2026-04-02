import Link from "next/link";
import { LifeBuoy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/types/support";

const statusColors: Record<string, string> = {
  open: "bg-green-500/15 text-green-600 dark:text-green-400",
  assigned: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  waiting_on_support: "bg-orange-500/15 text-orange-500",
  waiting_on_user: "bg-orange-500/15 text-orange-500",
  resolved: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_on_support: "Waiting on support",
  waiting_on_user: "Waiting on user",
  resolved: "Resolved",
  closed: "Closed",
};

const reasonLabels: Record<string, string> = {
  login_issues: "Login Issues",
  account_recovery: "Account Recovery",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  abuse_report: "Abuse Report",
  other: "Other",
};

interface TicketCardProps {
  ticket: SupportTicket;
  adminView?: boolean;
}

export default function TicketCard({ ticket, adminView = false }: TicketCardProps) {
  const href = adminView ? `/admin/support/${ticket.id}` : `/support/${ticket.id}`;

  return (
    <Link
      href={href}
      className="block px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <LifeBuoy className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">{ticket.subject}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {reasonLabels[ticket.reason] ?? ticket.reason}
            </span>
            {ticket.assignedTo && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">
                  {ticket.assignedTo.username}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleDateString()}
            </div>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColors[ticket.status])}>
              {statusLabels[ticket.status] ?? ticket.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
