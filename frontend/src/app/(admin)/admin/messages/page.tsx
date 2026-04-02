"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import ConversationViewer from "@/components/admin/ConversationViewer";
import api from "@/lib/api";
import { Search } from "lucide-react";

interface AdminMessage {
  id: string;
  senderId: string;
  senderUsername?: string;
  type: string;
  content: string | null;
  mediaUrl?: string | null;
  unsent: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fromQuery = searchParams.get("conversationId");
    if (fromQuery) {
      setConversationId(fromQuery);
      setInputValue(fromQuery);
    }
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-messages", conversationId],
    queryFn: async () => {
      const res = await api.get(`/admin/conversations/${conversationId}/messages`);
      return res.data.data as AdminMessage[];
    },
    enabled: !!conversationId,
  });

  const handleSearch = () => {
    if (inputValue.trim()) setConversationId(inputValue.trim());
  };

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Message Browser</h1>
          <p className="text-xs text-muted-foreground">
            Enter a Conversation ID to view its messages. All views are logged.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Conversation ID..."
              className="flex-1 h-10 px-3 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
            <button
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Load
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {!conversationId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm text-muted-foreground">Enter a conversation ID above to view messages.</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="flex justify-center py-10">
              <p className="text-sm text-destructive">Failed to load messages — check the conversation ID.</p>
            </div>
          ) : (
            <ConversationViewer messages={data ?? []} />
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
