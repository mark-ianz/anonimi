"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellOff, MoreVertical, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import type { Conversation } from "@/types/conversation";
import DateDisplay from "@/components/shared/DateDisplay";
import GroupAvatar from "@/components/shared/GroupAvatar";
import UserAvatar from "@/components/shared/UserAvatar";
import { decryptConversationPayload } from "@/lib/e2eeMessageCrypto";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  style?: React.CSSProperties;
  hrefBase?: "/chat" | "/archive";
}

type ConversationsInfiniteCache = {
  pages: Array<{ data: Conversation[] }>;
  pageParams: unknown[];
};

function getLastMessagePreview(conversation: Conversation, decryptedPreview?: string | null): string {
  const lm = conversation.lastMessage;
  if (!lm) return "No messages yet";
  if (lm.isE2ee && !lm.content) return decryptedPreview ?? "";
  if (lm.type === "image") return "📷 Photo";
  if (lm.type === "video") return "🎥 Video";
  if (lm.type === "audio") return "🎵 Audio";
  if (lm.type === "file") return "📎 File";
  if (lm.type === "system") return lm.content ?? "";
  return lm.content ?? "";
}

function clampPreview(text: string, maxLength: number = 47): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default function ConversationItem({
  conversation,
  isActive,
  style,
  hrefBase = "/chat",
}: ConversationItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { unreadCounts, conversations, setConversations, setMessages, clearUnread } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type === "group";
  const isArchived = !!conversation.isArchived;
  const participantId = conversation.participant?.id;
  const isTempParticipant = !isGroup && !!conversation.participant?.isTemporary;
  const isDeletedParticipant = !isGroup && !!conversation.participant?.isDeleted;
  const isConversationMuted = !!conversation.isMuted && (!conversation.mutedUntil || new Date(conversation.mutedUntil).getTime() > Date.now());
  const { status: presenceStatus } = usePresence(
    isGroup ? null : participantId,
    conversation.participant?.onlineStatus ?? "offline"
  );

  const [decryptedPreview, setDecryptedPreview] = useState<string | null>(null);

  useEffect(() => {
    const lm = conversation.lastMessage;
    if (!lm?.isE2ee || lm.content || !lm.contentCipher || !lm.contentIv || !lm.contentTag) return;

    let cancelled = false;
    (async () => {
      try {
        const content = await decryptConversationPayload({
          conversationId: conversation.id,
          cipherText: lm.contentCipher!,
          iv: lm.contentIv!,
          tag: lm.contentTag!,
          contentKeyVersion: lm.contentKeyVersion ?? null,
        });
        if (content == null || cancelled) return;
        if (!cancelled) setDecryptedPreview(content);
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [conversation.id, conversation.lastMessage]);

  const unread = unreadCounts[conversation.id] ?? conversation.unreadCount ?? 0;
  const hasUnread = unread > 0;

  const displayName = isGroup
    ? conversation.group?.name ?? "Group"
    : conversation.participant?.nickname ?? conversation.participant?.username ?? "Unknown";

  const displayImage = isGroup
    ? conversation.group?.image
    : conversation.participant?.profileImage;

  const isPending = conversation.requestStatus === "pending";
  const lastSenderIsMe = conversation.lastMessage?.senderId === user?.id;
  const lastSenderLabel = lastSenderIsMe
    ? "You"
    : conversation.lastMessage?.senderUsername ?? "Member";
  const basePreview = getLastMessagePreview(conversation, decryptedPreview);
  const isSystemMessage = conversation.lastMessage?.type === "system";
  const preview = isDeletedParticipant
    ? "Deleted temporary user"
    : isPending
    ? "Pending request..."
    : isSystemMessage
    ? basePreview
    : isGroup && conversation.lastMessage
    ? `${lastSenderLabel}: ${basePreview}`
    : lastSenderIsMe
    ? `You: ${basePreview}`
    : basePreview;
  const previewText = clampPreview(preview);
  const timestamp = conversation.lastMessage?.timestamp ?? conversation.updatedAt;

  const pruneConversationFromCache = (queryKey: readonly unknown[]) => {
    qc.setQueryData(
      queryKey,
      (old: ConversationsInfiniteCache | undefined): ConversationsInfiniteCache | undefined => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((conv) => conv.id !== conversation.id),
          })),
        };
      }
    );
  };

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${conversation.id}/archive`);
    },
    onSuccess: () => {
      toast.success("Conversation archived.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      if (isActive && pathname?.startsWith("/chat")) {
        router.push("/chat");
      }
      setMenuOpen(false);
    },
    onError: () => toast.error("Failed to archive conversation."),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}/archive`);
    },
    onSuccess: () => {
      toast.success("Conversation moved to Chats.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      if (isActive && pathname?.startsWith("/archive")) {
        router.push("/archive");
      }
      setMenuOpen(false);
    },
    onError: () => toast.error("Failed to unarchive conversation."),
  });

  const muteConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/conversations/${conversation.id}/mute`, {});
      return res.data.data as { mutedUntil?: string | null };
    },
    onSuccess: (data) => {
      const mutedUntil = data?.mutedUntil ?? null;
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      clearUnread(conversation.id);
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversation.id ? { ...conv, isMuted: true, mutedUntil } : conv
        ),
      }));
      toast.success("Conversation muted.");
      setMenuOpen(false);
    },
    onError: () => toast.error("Failed to mute conversation."),
  });

  const unmuteConversationMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}/mute`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversation.id ? { ...conv, isMuted: false, mutedUntil: null } : conv
        ),
      }));
      toast.success("Conversation unmuted.");
      setMenuOpen(false);
    },
    onError: () => toast.error("Failed to unmute conversation."),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}`);
    },
    onSuccess: () => {
      setConversations(conversations.filter((c) => c.id !== conversation.id));
      setMessages(conversation.id, []);
      clearUnread(conversation.id);

      qc.removeQueries({ queryKey: ["messages", conversation.id] });
      qc.removeQueries({ queryKey: ["conversation", conversation.id] });
      pruneConversationFromCache(["conversations", "active"]);
      pruneConversationFromCache(["conversations", "archived"]);

      toast.success("Conversation deleted.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });


      if (isActive) {
        const fallback = pathname?.startsWith("/archive") ? "/archive" : "/chat";
        router.push(fallback);
      }

      setShowDeleteConfirmModal(false);
      setDeleteConfirmText("");
      setMenuOpen(false);
    },
    onError: () => toast.error("Failed to delete conversation."),
  });

  useEffect(() => {
    if (!menuOpen) return;

    const updateMenuPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 160;
      const viewportWidth = window.innerWidth;
      const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8));
      setMenuPosition({ top: rect.bottom + 6, left });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuOpen]);

  return (
    <div
      style={style}
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 transition-colors group border-b border-border/20 animate-fade-in",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <Link
        href={`${hrefBase}/${conversation.id}`}
        aria-label={`Open ${displayName}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {isGroup ? (
            <GroupAvatar
              imageUrl={displayImage}
              fallbackProfileImages={conversation.group?.fallbackProfileImages}
              name={displayName}
              alt={displayName}
              className="w-12 h-12"
              roundedClassName="rounded-xl"
              textClassName="text-sm"
            />
          ) : (
            <UserAvatar
              imageUrl={displayImage}
              name={displayName}
              alt={displayName}
              className="w-12 h-12"
              roundedClassName="rounded-xl"
              textClassName="text-sm"
            />
          )}
          {!isGroup && (
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full",
                presenceStatus === "online"
                  ? "bg-green-500"
                  : presenceStatus === "away"
                  ? "bg-yellow-500"
                  : presenceStatus === "dnd"
                  ? "bg-red-500"
                  : "bg-muted-foreground/40"
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex min-w-0 items-center justify-between">
            <span
              className={cn(
                "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm",
                hasUnread ? "font-semibold text-foreground" : "font-medium"
              )}
            >
              {displayName}
            </span>
            {isConversationMuted && (
              <BellOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 ml-1" />
            )}
            {isTempParticipant && !isDeletedParticipant && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                Temporary
              </span>
            )}
            {timestamp && (
              <DateDisplay
                date={timestamp}
                format="relative"
                className={cn("shrink-0 ml-2", hasUnread && "text-primary font-medium")}
              />
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <p
              className={cn(
                "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs",
                hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {previewText}
            </p>
            {hasUnread && (
              <span className="ml-2 flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div
        className="absolute right-3 top-1/2 z-20 h-8 w-8 -translate-y-1/2"
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className={cn(
            "h-8 w-8 rounded-md border border-border/50 bg-background/80 flex items-center justify-center text-foreground/90 transition-all duration-150 cursor-pointer",
            menuOpen
              ? "visible opacity-100 pointer-events-auto bg-muted text-foreground"
              : "invisible opacity-0 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-muted/90 hover:text-foreground"
          )}
          aria-label="Conversation actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && menuPosition && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-120 min-w-40 overflow-hidden rounded-xl border border-border/60 bg-card/95 p-1 shadow-elevated backdrop-blur-sm"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isConversationMuted) {
                  unmuteConversationMutation.mutate();
                } else {
                  muteConversationMutation.mutate();
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60"
            >
              <BellOff className="h-4 w-4 text-muted-foreground" />
              {isConversationMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isArchived) {
                  unarchiveMutation.mutate();
                } else {
                  archiveMutation.mutate();
                }
              }}
              disabled={archiveMutation.isPending || unarchiveMutation.isPending}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <Archive className="h-4 w-4 text-muted-foreground" />
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuOpen(false);
                setShowDeleteConfirmModal(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete conversation
            </button>
          </div>,
          document.body
        )}

      {showDeleteConfirmModal && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-130 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (deleteConversationMutation.isPending) return;
                setShowDeleteConfirmModal(false);
                setDeleteConfirmText("");
              }}
            />

            <div className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated space-y-4">
              <h3 className="font-display font-semibold text-base text-destructive">Delete Conversation</h3>
              <p className="text-sm text-muted-foreground">
                This clears your existing messages in this chat. New messages can make this conversation appear again.
              </p>
              <p className="text-xs text-muted-foreground">
                Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
              </p>

              <input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm"
                autoFocus
                disabled={deleteConversationMutation.isPending}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deleteConversationMutation.isPending}
                  className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteConversationMutation.mutate()}
                  disabled={deleteConversationMutation.isPending || deleteConfirmText !== "DELETE"}
                  className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
                >
                  {deleteConversationMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
