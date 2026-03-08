"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SupportTicketDetail, SupportMessage } from "@/types/support";

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

function MessageBubble({ msg, isOwn }: { msg: SupportMessage; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/60 text-foreground rounded-bl-md"
        )}
      >
        {!isOwn && (
          <p className="text-[11px] font-semibold mb-1 opacity-70">Support Team</p>
        )}
        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
        <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-foreground/60 text-right" : "text-muted-foreground")}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function SupportTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      const res = await api.get(`/support/tickets/${ticketId}`);
      return res.data.data as SupportTicketDetail;
    },
    enabled: !!ticketId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/support/tickets/${ticketId}/messages`, { content: reply.trim() });
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
    },
    onError: () => {
      toast.error("Failed to send reply");
    },
  });

  const handleSend = () => {
    if (reply.trim()) replyMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = data?.ticket.status === "resolved" || data?.ticket.status === "closed";

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
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
                <>
                  <p className="text-sm font-semibold truncate">{data?.ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColors[data?.ticket.status ?? "open"])}>
                      {statusLabels[data?.ticket.status ?? "open"]}
                    </span>
                    {data?.ticket.assignedTo && (
                      <span className="text-[10px] text-muted-foreground">
                        Assigned to {data.ticket.assignedTo.username}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
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
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.senderId === user?.id || msg.senderRole === "user"}
                />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        {!isClosed && (
          <div className="p-3 border-t border-border/30 shrink-0">
            <div className="flex items-end gap-2 bg-muted/40 border border-border/40 rounded-2xl px-3 py-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none max-h-32 py-0.5"
                style={{ minHeight: "24px" }}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || replyMutation.isPending}
                className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
              >
                {replyMutation.isPending ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="p-3 border-t border-border/30 shrink-0 text-center">
            <p className="text-xs text-muted-foreground">This ticket is {data?.ticket.status}.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
