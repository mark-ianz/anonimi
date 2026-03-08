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
      {/* Header */}
      <div className="p-4 border-b border-border/30 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-display font-semibold">Messages</h1>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
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
