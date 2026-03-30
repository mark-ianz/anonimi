"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import type { Conversation } from "@/types/conversation";
import ChatView from "@/components/chat/ChatView";
import ConversationSearch from "@/components/conversations/ConversationSearch";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { data: conversation, isLoading, isError } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await api.get(`/conversations/${conversationId}`);
      return res.data.data as Conversation;
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60,
  });

  return (
    <ProtectedRoute>
      <div className="flex h-full">
        {/* Sidebar conversation list (hidden on mobile) */}
        <div className="hidden md:flex w-80 lg:w-96 border-r border-border/50 flex-col shrink-0">
          <ConversationSearch activeConversationId={conversationId} />
        </div>

        {/* Chat view */}
        <div className="relative z-10 flex-1 flex flex-col overflow-visible">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : isError || !conversation ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Conversation not found.
            </div>
          ) : (
            <ChatView conversation={conversation} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
