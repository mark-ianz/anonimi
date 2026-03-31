"use client";

import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useConversations } from "@/hooks/useConversations";
import ConversationItem from "@/components/conversations/ConversationItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import SearchInput from "@/components/shared/SearchInput";
import Link from "next/link";

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const { conversations, isLoading } = useConversations();

  const groups = conversations.filter((c) => c.type === "group");
  const filtered = search
    ? groups.filter((g) => g.group?.name?.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <ProtectedRoute>
      <div className="flex h-full flex-col bg-background">
        <div className="shrink-0 space-y-3 border-b border-border/60 bg-card/45 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Collaboration
              </p>
              <h1 className="mt-1 text-2xl leading-tight font-semibold">Groups</h1>
            </div>
            <Link
              href="/groups/create"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
          <SearchInput placeholder="Search groups..." value={search} onChange={setSearch} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSkeleton variant="conversation" rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="conversations"
              title="No groups yet"
              description="Create a group to chat with multiple contacts at once."
              action={
                <Link
                  href="/groups/create"
                  className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  New Group
                </Link>
              }
            />
          ) : (
            filtered.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} />
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
