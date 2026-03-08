"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import { useConversations } from "@/hooks/useConversations";
import ConversationItem from "@/components/conversations/ConversationItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import SearchInput from "@/components/shared/SearchInput";

export default function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const { conversations, isLoading } = useConversations();

  const groups = conversations.filter((c) => c.type === "group");
  const filtered = search
    ? groups.filter((g) => g.group?.name?.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-semibold">Groups</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <SearchInput placeholder="Search groups..." value={search} onChange={setSearch} />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSkeleton variant="conversation" rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="conversations"
              title="No groups yet"
              description="Create a group to chat with multiple contacts at once."
              action={
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Group
                </button>
              }
            />
          ) : (
            filtered.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} />
            ))
          )}
        </div>
      </div>

      <CreateGroupDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </ProtectedRoute>
  );
}
