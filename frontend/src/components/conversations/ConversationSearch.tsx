"use client";

import { useState, useCallback } from "react";
import { Edit } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import ConversationList from "./ConversationList";

interface ConversationSearchProps {
  activeConversationId?: string;
  onNewChat?: () => void;
}

export default function ConversationSearch({
  activeConversationId,
  onNewChat,
}: ConversationSearchProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border/60 bg-card/45 p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl leading-tight font-semibold">Messages</h1>
          </div>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted"
              title="New conversation"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
        <SearchInput
          placeholder="Search conversations..."
          value={query}
          onChange={setQuery}
        />
      </div>

      <ConversationList
        activeConversationId={activeConversationId}
        searchQuery={query}
      />
    </div>
  );
}
