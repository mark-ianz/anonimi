"use client";

import ConversationSearch from "@/components/conversations/ConversationSearch";
import EmptyState from "@/components/shared/EmptyState";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-full">
        {/* Conversation list - full width on mobile, fixed width on desktop */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border/50 flex flex-col shrink-0">
          <ConversationSearch />
        </div>

        {/* Empty state shown on md+ when no chat is selected */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
          <EmptyState
            variant="messages"
            title="Select a conversation"
            description="Choose from your existing conversations or start a new one to begin messaging."
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
