"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ConversationItem from "@/components/conversations/ConversationItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import type { Conversation } from "@/types/conversation";

export default function MessageRequestsPage() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const res = await api.get("/conversations/requests");
      return res.data.data as Conversation[];
    },
    staleTime: 1000 * 60,
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
            requests.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} />
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
