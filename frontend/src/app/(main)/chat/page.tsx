"use client";

import ConversationSearch from "@/components/conversations/ConversationSearch";
import EmptyState from "@/components/shared/EmptyState";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-full bg-background">
        <div className="w-full shrink-0 border-r border-border/60 md:w-80 lg:w-96">
          <ConversationSearch />
        </div>

        <div className="hidden flex-1 bg-card/30 md:flex md:flex-col">
          <div className="h-16 border-b border-border/60 px-6 flex items-center">
            <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Conversation Preview
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              variant="messages"
              title="Select a conversation"
              description="Choose from your conversations or start a new chat to begin messaging."
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
