"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getChatSocket } from "@/lib/socket";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import type { Conversation } from "@/types/conversation";

export default function MessageRequestsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const res = await api.get("/conversations/requests");
      return res.data.data as Conversation[];
    },
    staleTime: 1000 * 60,
  });

  // Live updates: new message request arrives
  useEffect(() => {
    const socket = getChatSocket();
    const handleNew = () => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
    };
    socket.on("message-request:new", handleNew);
    return () => { socket.off("message-request:new", handleNew); };
  }, [qc]);

  const acceptMutation = useMutation({
    mutationFn: async ({ requestId, addToContacts }: { requestId: string; addToContacts: boolean }) => {
      const res = await api.patch(`/message-requests/${requestId}/accept`, { addToContacts });
      return res.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Request accepted.");
      router.push(`/chat/${data.conversationId}`);
    },
    onError: () => toast.error("Failed to accept request."),
  });

  const ignoreMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/message-requests/${requestId}/ignore`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      toast.success("Request ignored.");
    },
    onError: () => toast.error("Failed to ignore request."),
  });

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border/30 shrink-0">
          <h1 className="text-xl font-display font-semibold">Message Requests</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Messages from people you haven&apos;t connected with yet.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSkeleton variant="conversation" rows={4} />
          ) : !requests || requests.length === 0 ? (
            <EmptyState
              variant="requests"
              title="No message requests"
              description="When someone sends you a message for the first time, it will appear here."
            />
          ) : (
            requests.map((conv) => {
              const name = conv.participant?.username ?? "Unknown";
              const preview = conv.lastMessage?.content ?? "Sent a message";
              const requestId = conv.requestId ?? "";

              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/20 group"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className="shrink-0"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {conv.participant?.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.participant.profileImage}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        name[0].toUpperCase()
                      )}
                    </div>
                  </button>

                  {/* Info */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => router.push(`/chat/${conv.id}`)}
                  >
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{preview}</p>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => acceptMutation.mutate({ requestId, addToContacts: false })}
                      disabled={acceptMutation.isPending}
                      title="Accept"
                      className="flex items-center gap-1 h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => acceptMutation.mutate({ requestId, addToContacts: true })}
                      disabled={acceptMutation.isPending}
                      title="Accept & Add to Contacts"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => ignoreMutation.mutate(requestId)}
                      disabled={ignoreMutation.isPending}
                      title="Ignore"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

