"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import TicketCard from "@/components/admin/TicketCard";
import api from "@/lib/api";
import { getAdminSocket } from "@/lib/socket";
import type { SupportTicket, TicketStatus } from "@/types/support";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const statuses: { value: TicketStatus | "all" | "mine"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Assigned to me" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_support", label: "Waiting on Support" },
  { value: "waiting_on_user", label: "Waiting on User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function AdminSupportPage() {
  const [status, setStatus] = useState<TicketStatus | "all" | "mine">("open");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-tickets", status],
    queryFn: async () => {
      const params = status !== "all" && status !== "mine" ? { status } : {};
      const res = await api.get("/admin/support/tickets", { params });
      return res.data.data as SupportTicket[];
    },
    placeholderData: (prev) => prev,
  });

  const tickets = (data ?? []).filter((ticket) => {
    if (status !== "mine") return true;
    return ticket.assignedTo?.id === user?.id;
  });

  useEffect(() => {
    const socket = getAdminSocket();
    socket.connect();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    };

    socket.on("admin:support:ticket:new", handleUpdate);
    socket.on("admin:support:ticket:updated", handleUpdate);
    socket.on("admin:support:message:new", handleUpdate);

    return () => {
      socket.off("admin:support:ticket:new", handleUpdate);
      socket.off("admin:support:ticket:updated", handleUpdate);
      socket.off("admin:support:message:new", handleUpdate);
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Support Tickets</h1>
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                  status === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            tickets.map((t) => <TicketCard key={t.id} ticket={t} adminView />)
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
