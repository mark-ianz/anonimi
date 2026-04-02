"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, LifeBuoy, ChevronRight, Clock } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { SupportReportItem, SupportTicket } from "@/types/support";
import type { AppNotification } from "@/types/notification";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-green-500/15 text-green-600 dark:text-green-400",
  assigned: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  waiting_on_support: "bg-orange-500/15 text-orange-500",
  waiting_on_user: "bg-orange-500/15 text-orange-500",
  resolved: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  under_review: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  dismissed: "bg-muted text-muted-foreground",
  warning: "bg-destructive/15 text-destructive",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_on_support: "Waiting on support",
  waiting_on_user: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
  pending: "Pending",
  under_review: "Under Review",
  dismissed: "Dismissed",
  warning: "Warning",
};

const reasonLabels: Record<string, string> = {
  login_issues: "Login Issues",
  account_recovery: "Account Recovery",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  abuse_report: "Abuse Report",
  other: "Other",
  harassment: "Harassment",
  spam: "Spam",
  hate_speech: "Hate Speech",
  violence: "Violence",
  explicit_content: "Explicit Content",
  misinformation: "Misinformation",
  scam: "Scam",
  impersonation: "Impersonation",
  illegal_content: "Illegal Content",
};

const reportTargetLabels: Record<string, string> = {
  message: "Message",
  user: "User",
  group: "Group",
};

function WarningRow({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}) {
  const isUnread = !notification.read;

  return (
    <button
      type="button"
      onClick={() => onDismiss(notification.id)}
      className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/30 transition-colors"
      title="Dismiss warning"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">Account Warning</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate">
            {notification.body}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(notification.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isUnread && (
          <span className="h-2 w-2 rounded-full bg-destructive" />
        )}
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors.warning)}>
          {statusLabels.warning}
        </span>
      </div>
    </button>
  );
}

function TicketRow({ ticket, unreadCount }: { ticket: SupportTicket; unreadCount: number }) {
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
        {unreadCount > 0 && (
          <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[ticket.status])}>
          {statusLabels[ticket.status] ?? ticket.status}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function ReportRow({ report }: { report: SupportReportItem }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20 last:border-b-0">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">Report · {reportTargetLabels[report.targetType] ?? report.targetType}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {reasonLabels[report.reason] ?? report.reason}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(report.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusColors[report.status])}>
          {statusLabels[report.status] ?? report.status}
        </span>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [filter, setFilter] = useState<"all" | "tickets" | "reports" | "warnings">("all");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["support-overview"],
    queryFn: async () => {
      const [ticketsRes, reportsRes, notificationsRes] = await Promise.all([
        api.get("/support/tickets"),
        api.get("/support/reports"),
        api.get("/notifications", { params: { limit: 50 } }),
      ]);

      return {
        tickets: ticketsRes.data.data as SupportTicket[],
        reports: reportsRes.data.data as SupportReportItem[],
        notifications: notificationsRes.data.data.notifications as AppNotification[],
      };
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-overview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-overview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const tickets = data?.tickets ?? [];
  const reports = data?.reports ?? [];
  const warningNotifications = (data?.notifications ?? []).filter((n) =>
    n.type.toLowerCase().includes("warning")
  );
  const unreadNotifications = (data?.notifications ?? []).filter((n) => !n.read);
  const unreadWarnings = warningNotifications.filter((n) => !n.read).length;
  const unreadByTicketId = unreadNotifications.reduce<Record<string, number>>((acc, n) => {
    const ticketId = n.data?.ticketId;
    if (typeof ticketId === "string") {
      acc[ticketId] = (acc[ticketId] ?? 0) + 1;
    }
    return acc;
  }, {});
  const items = [
    ...tickets.map((ticket) => ({
      type: "ticket" as const,
      updatedAt: ticket.updatedAt,
      ticket,
    })),
    ...reports.map((report) => ({
      type: "report" as const,
      updatedAt: report.updatedAt,
      report,
    })),
    ...warningNotifications.map((notification) => ({
      type: "warning" as const,
      updatedAt: notification.createdAt,
      notification,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "tickets") return item.type === "ticket";
    if (filter === "reports") return item.type === "report";
    return item.type === "warning";
  });

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

        <div className="px-4 py-2 border-b border-border/20 flex flex-wrap gap-2 text-xs">
          {([
            { value: "all", label: "All" },
            { value: "tickets", label: "Tickets" },
            { value: "reports", label: "Reports" },
            { value: "warnings", label: "Warnings" },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
          {unreadWarnings > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="ml-auto h-7 px-3 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <LifeBuoy className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm mb-1">No support items</p>
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
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </p>
              {filteredItems.map((item) =>
                item.type === "ticket" ? (
                  <TicketRow
                    key={`ticket-${item.ticket.id}`}
                    ticket={item.ticket}
                    unreadCount={unreadByTicketId[item.ticket.id] ?? 0}
                  />
                ) : item.type === "report" ? (
                  <ReportRow key={`report-${item.report.id}`} report={item.report} />
                ) : (
                  <WarningRow
                    key={`warning-${item.notification.id}`}
                    notification={item.notification}
                    onDismiss={(id) => markReadMutation.mutate(id)}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
