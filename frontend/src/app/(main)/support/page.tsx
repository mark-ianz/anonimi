"use client";

import Link from "next/link";
import { Plus, LifeBuoy, ChevronRight, Clock } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { SupportTicket } from "@/types/support";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-green-500/15 text-green-600 dark:text-green-400",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  resolved: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
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

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  return (
    <Link
      href={`/support/${ticket.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">{ticket.subject}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {reasonLabels[ticket.reason] ?? ticket.reason}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(ticket.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[ticket.status])}>
          {statusLabels[ticket.status] ?? ticket.status}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default function SupportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const res = await api.get("/support/tickets");
      return res.data.data as SupportTicket[];
    },
  });

  const tickets = data ?? [];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-semibold">Support</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Get help from our team</p>
          </div>
          <Link
            href="/support/create"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Ticket
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <LifeBuoy className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm mb-1">No support tickets</p>
              <p className="text-xs text-muted-foreground mb-4">
                Need help? Our support team is here.
              </p>
              <Link
                href="/support/create"
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create ticket
              </Link>
            </div>
          ) : (
            <div>
              <p className="px-4 py-2.5 text-xs text-muted-foreground">
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
              </p>
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
