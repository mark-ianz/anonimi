"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getAdminSocket } from "@/lib/socket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { SupportTicketDetail, SupportMessage } from "@/types/support";

const statusLabels: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_on_support: "Waiting on Support",
  waiting_on_user: "Waiting on User",
  resolved: "Resolved",
  closed: "Closed",
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_support", label: "Waiting on Support" },
  { value: "waiting_on_user", label: "Waiting on User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function MessageBubble({ msg }: { msg: SupportMessage }) {
  const isStaff = msg.senderRole === "staff";
  const label = msg.senderUsername ?? "User";
  const mediaUrl = msg.mediaUrl ? resolveMediaUrl(msg.mediaUrl) : null;
  const isImage = msg.type === "image" && !!mediaUrl;
  return (
    <div className={cn("flex", isStaff ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
          isStaff
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/60 text-foreground rounded-bl-md"
        )}
      >
        {!isStaff && (
          <p className="text-[11px] font-semibold mb-1 opacity-70">{label}</p>
        )}
        {isImage ? (
          <img
            src={mediaUrl as string}
            alt="Support upload"
            className="max-h-72 rounded-xl object-cover"
          />
        ) : null}
        {msg.content && (
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}
        <p className={cn("text-[10px] mt-1", isStaff ? "text-primary-foreground/60 text-right" : "text-muted-foreground")}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function AdminSupportTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-ticket", ticketId],
    queryFn: async () => {
      const res = await api.get(`/admin/support/tickets/${ticketId}`);
      return res.data.data as SupportTicketDetail;
    },
    enabled: !!ticketId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  useEffect(() => {
    if (!ticketId) return;
    const socket = getAdminSocket();
    socket.connect();

    const handleUpdate = (payload?: { ticketId?: string }) => {
      if (payload?.ticketId && payload.ticketId !== ticketId) return;
      queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    };

    socket.on("admin:support:ticket:updated", handleUpdate);
    socket.on("admin:support:message:new", handleUpdate);

    return () => {
      socket.off("admin:support:ticket:updated", handleUpdate);
      socket.off("admin:support:message:new", handleUpdate);
      socket.disconnect();
    };
  }, [ticketId, queryClient]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/support/tickets/${ticketId}/messages`, { content: reply.trim() });
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await api.patch(`/admin/support/tickets/${ticketId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setShowStatusMenu(false);
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/support/tickets/${ticketId}/assign`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", ticketId] });
      toast.success("Ticket assigned to you");
    },
    onError: () => toast.error("Failed to assign ticket"),
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (reply.trim()) replyMutation.mutate();
    }
  };

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              ) : (
                <p className="text-sm font-semibold truncate">{data?.ticket.subject}</p>
              )}
            </div>
            {/* Status dropdown */}
            {data && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowStatusMenu((v) => !v)}
                  className="h-7 px-2.5 rounded-lg bg-muted/60 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {statusLabels[data.ticket.status] ?? data.ticket.status}
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute right-0 top-9 z-20 w-44 bg-popover border border-border/40 rounded-xl shadow-elevated overflow-hidden">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => statusMutation.mutate(opt.value)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors",
                            data.ticket.status === opt.value ? "text-primary font-medium" : "text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {data && !data.ticket.assignedTo && (
              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="h-7 px-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20 disabled:opacity-50 transition-colors shrink-0"
              >
                {assignMutation.isPending ? "..." : "Claim"}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {data?.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Reply input */}
        <div className="p-3 border-t border-border/30 shrink-0">
          <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-2xl px-3 py-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply as support staff..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none max-h-32 py-0.5"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={() => reply.trim() && replyMutation.mutate()}
              disabled={!reply.trim() || replyMutation.isPending}
              className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
            >
              {replyMutation.isPending ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
