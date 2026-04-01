"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Edit, Plus } from "lucide-react";
import SearchInput from "@/components/shared/SearchInput";
import ConversationList from "./ConversationList";
import type { ConversationListFilter } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface ConversationSearchProps {
  activeConversationId?: string;
  onNewChat?: () => void;
  filter?: ConversationListFilter;
}

export default function ConversationSearch({
  activeConversationId,
  onNewChat,
  filter = "active",
}: ConversationSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const conversationType =
    tabParam === "unread" || tabParam === "private" || tabParam === "groups"
      ? tabParam
      : "all";

  const canShowTabs = filter === "active";

  const setTab = (nextTab: "all" | "unread" | "private" | "groups") => {
    if (!canShowTabs) return;
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const queryString = params.toString();
    const targetPath = activeConversationId ? "/chat" : pathname;
    router.replace(queryString ? `${targetPath}?${queryString}` : targetPath);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 bg-card/45 p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {filter === "archived" ? "Archive" : "Workspace"}
            </p>
            <h1 className="mt-1 text-2xl leading-tight font-semibold">
              {filter === "archived" ? "Archived" : "Messages"}
            </h1>
          </div>
          {onNewChat && filter === "active" && (
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
          placeholder={
            filter === "archived"
              ? "Search archived conversations..."
              : "Search conversations..."
          }
          value={query}
          onChange={setQuery}
        />

        {canShowTabs && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex gap-1 rounded-xl border border-border/60 bg-background p-1">
              <button
                type="button"
                onClick={() => setTab("all")}
                aria-pressed={conversationType === "all"}
                className={cn(
                  "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                  conversationType === "all"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTab("unread")}
                aria-pressed={conversationType === "unread"}
                className={cn(
                  "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                  conversationType === "unread"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setTab("private")}
                aria-pressed={conversationType === "private"}
                className={cn(
                  "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                  conversationType === "private"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setTab("groups")}
                aria-pressed={conversationType === "groups"}
                className={cn(
                  "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                  conversationType === "groups"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Groups
              </button>
            </div>

            {conversationType === "groups" && (
              <Link
                href="/groups/create"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                New group
              </Link>
            )}
          </div>
        )}
      </div>

      <ConversationList
        activeConversationId={activeConversationId}
        searchQuery={query}
        filter={filter}
        conversationType={canShowTabs ? conversationType : "all"}
      />
    </div>
  );
}
