"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { getChatSocket } from "@/lib/socket";
import api from "@/lib/api";
import { decryptMessage, importKeyFromBase64 } from "@/lib/e2eeCrypto";
import { getConversationKeys } from "@/lib/e2eeKeyStore";
import type { Conversation } from "@/types/conversation";
import type { GroupMember } from "@/types/group";
import type { Message } from "@/types/message";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import DateDisplay from "@/components/shared/DateDisplay";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroup } from "@/hooks/useGroups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimestampBubblePosition = "single" | "first" | "middle" | "last";

interface MessageListProps {
  conversation: Conversation;
  onEditStart?: (message: Message) => void;
  onReplyStart?: (message: Message) => void;
}

function shouldShowDateDivider(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  const a = new Date(prev).toDateString();
  const b = new Date(curr).toDateString();
  return a !== b;
}

function shouldShowTimeDivider(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  const prevDate = new Date(prev);
  const currDate = new Date(curr);
  if (prevDate.toDateString() !== currDate.toDateString()) return true;

  const diffMs = Math.abs(currDate.getTime() - prevDate.getTime());
  return diffMs >= 15 * 60 * 1000;
}

function getTimeBucketKey(value: string): number {
  const time = new Date(value).getTime();
  return Math.floor(time / (15 * 60 * 1000));
}

export default function MessageList({ conversation, onEditStart, onReplyStart }: MessageListProps) {
  const { user } = useAuthStore();
  const { clearUnread } = useChatStore();
  const { messages, isLoading, isFetchingMore, hasMore, fetchMore } = useMessages(conversation.id);
  const { typingUsers } = useTyping(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollIdleTimeoutRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  const targetMessageId = searchParams.get("messageId");
  const isFirstLoad = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const emittedReadIdsRef = useRef<Set<string>>(new Set());
  const [canMarkRead, setCanMarkRead] = useState(true);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const scrollTargetHandledRef = useRef<string | null>(null);
  const groupId = conversation.type === "group" ? conversation.group?.id ?? null : null;
  const bottomThreshold = 24;

  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [muteDuration, setMuteDuration] = useState(60);
  const [muteReason, setMuteReason] = useState("");

  const { muteMember, unmuteMember, removeMember } = useGroup(groupId ?? "");

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data.data as GroupMember[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });

  const myJoinedAt = useMemo(() => {
    if (!groupId || !user?.id) return null;
    const member = groupMembers.find((m) => m.userId === user.id);
    return member?.joinedAt ? new Date(member.joinedAt).getTime() : null;
  }, [groupId, user?.id, groupMembers]);

  const visibleMessages = useMemo(() => {
    if (!myJoinedAt) return messages;
    return messages.filter((m) => new Date(m.createdAt).getTime() >= myJoinedAt);
  }, [messages, myJoinedAt]);

  const [decryptedContent, setDecryptedContent] = useState<Record<string, string>>({});
  const decryptedIdsRef = useRef(new Set<string>());
  const decryptingRef = useRef(false);

  useEffect(() => {
    if (decryptingRef.current) return;

    const pending = visibleMessages.filter(
      (m) => m.isE2ee && m.contentCipher && m.contentIv && m.contentTag && !m.content && !decryptedIdsRef.current.has(m.id)
    );

    if (pending.length === 0) return;

    decryptingRef.current = true;

    getConversationKeys(conversation.id).then((keys) => {
      if (keys.length === 0) {
        decryptingRef.current = false;
        return;
      }

      const importAllKeys = async () => {
        const importedKeys = await Promise.all(
          keys.map(async (k) => ({
            version: k.keyVersion,
            aesKey: await importKeyFromBase64(k.key),
          }))
        );

        const updates: Record<string, string> = {};

        const decryptNext = async (index: number) => {
          if (index >= pending.length) {
            if (Object.keys(updates).length > 0) {
              setDecryptedContent((prev) => ({ ...prev, ...updates }));
            }
            decryptingRef.current = false;
            return;
          }

          const msg = pending[index];
          let decrypted = false;

          for (const { version, aesKey } of importedKeys) {
            try {
              const content = await decryptMessage(msg.contentCipher!, msg.contentIv!, msg.contentTag!, aesKey);
              updates[msg.id] = content;
              decryptedIdsRef.current.add(msg.id);
              decrypted = true;
              break;
            } catch {
              // Try next key
            }
          }

          if (!decrypted) {
            decryptedIdsRef.current.add(msg.id);
          }

          await decryptNext(index + 1);
        };

        return decryptNext(0);
      };

      return importAllKeys();
    }).catch(() => {
      decryptingRef.current = false;
    });
  }, [visibleMessages, conversation.id]);

  const displayMessages = useMemo(() => {
    if (Object.keys(decryptedContent).length === 0) return visibleMessages;
    return visibleMessages.map((m) =>
      decryptedContent[m.id] ? { ...m, content: decryptedContent[m.id] } : m
    );
  }, [visibleMessages, decryptedContent]);

  const groupMemberMetaById = useMemo(() => {
    const map: Record<string, { name: string; anonimiId: string; profileImage: string | null }> = {};
    groupMembers.forEach((member) => {
      map[member.userId] = {
        name: member.nickname?.trim() || member.username,
        anonimiId: member.anonimiId,
        profileImage: member.profileImage ?? null,
      };
    });
    return map;
  }, [groupMembers]);

  const reactionUserMetaById = useMemo(() => {
    const map: Record<string, { name?: string; profileImage?: string | null; anonimiId?: string }> = {};

    if (user?.id) {
      map[user.id] = {
        name: user.username ?? user.anonimiId ?? "You",
        profileImage: user.profileImage ?? null,
        anonimiId: user.anonimiId,
      };
    }

    if (conversation.type === "private" && conversation.participant) {
      map[conversation.participant.id] = {
        name: conversation.participant.nickname ?? conversation.participant.username,
        profileImage: conversation.participant.profileImage ?? null,
        anonimiId: conversation.participant.anonimiId,
      };
    }

    if (conversation.type === "group") {
      Object.entries(groupMemberMetaById).forEach(([userId, meta]) => {
        map[userId] = {
          name: meta.name,
          profileImage: meta.profileImage ?? null,
          anonimiId: meta.anonimiId,
        };
      });
    }

    return map;
  }, [user?.id, user?.username, user?.anonimiId, user?.profileImage, conversation, groupMemberMetaById]);

  const displayTypingUsers = useMemo(() => {
    const filtered = typingUsers.filter((typingUser: { userId: string }) => typingUser.userId !== user?.id);
    const sorted = [...filtered].sort(
      (a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0)
    );

    return sorted.map((typingUser) => {
      let name = typingUser.username;
      let profileImage: string | null = null;

      if (conversation.type === "private" && typingUser.userId === conversation.participant?.id) {
        name = conversation.participant?.nickname ?? conversation.participant?.username ?? name;
        profileImage = conversation.participant?.profileImage ?? null;
      } else if (conversation.type === "group") {
        const meta = groupMemberMetaById[typingUser.userId];
        name = meta?.name ?? name;
        profileImage = meta?.profileImage ?? null;
      }

      return {
        userId: typingUser.userId,
        username: name?.trim() || "User",
        profileImage,
      };
    });
  }, [typingUsers, user?.id, conversation, groupMemberMetaById]);

  const currentUserMembership = useMemo(() => {
    return user?.id ? groupMembers.find((m) => m.userId === user.id) : null;
  }, [user?.id, groupMembers]);
  const currentUserRole = currentUserMembership?.role;

  const computeIsAtBottom = useCallback((node: HTMLDivElement | null) => {
    if (!node) return true;
    return node.scrollTop + node.clientHeight >= node.scrollHeight - bottomThreshold;
  }, [bottomThreshold]);

  const handleViewportScroll = useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;
    setIsAtBottom(computeIsAtBottom(node));
    setIsUserScrolling(true);
    if (scrollIdleTimeoutRef.current) {
      window.clearTimeout(scrollIdleTimeoutRef.current);
    }
    scrollIdleTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
    }, 250);
  }, [computeIsAtBottom]);

  useEffect(() => {
    const computeCanMarkRead = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();

    const syncCanMarkRead = () => {
      setCanMarkRead(computeCanMarkRead());
    };

    syncCanMarkRead();
    window.addEventListener("focus", syncCanMarkRead);
    window.addEventListener("blur", syncCanMarkRead);
    document.addEventListener("visibilitychange", syncCanMarkRead);

    return () => {
      window.removeEventListener("focus", syncCanMarkRead);
      window.removeEventListener("blur", syncCanMarkRead);
      document.removeEventListener("visibilitychange", syncCanMarkRead);
    };
  }, []);

  useEffect(() => {
    emittedReadIdsRef.current.clear();
  }, [conversation.id]);

  useEffect(() => {
    setHighlightMessageId(null);
    scrollTargetHandledRef.current = null;
    setNewMessageCount(0);
    setIsAtBottom(true);
    setIsUserScrolling(false);
  }, [conversation.id, targetMessageId]);

  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to bottom on first load and when new messages arrive from me
  useEffect(() => {
    if (!isLoading && isFirstLoad.current && !targetMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      setIsAtBottom(true);
      isFirstLoad.current = false;
    }
  }, [isLoading, targetMessageId]);

  useEffect(() => {
    if (!displayMessages.length) return;
    const last = displayMessages[displayMessages.length - 1];
    const newestChanged = lastMessageIdRef.current !== last.id;
    lastMessageIdRef.current = last.id;

    // Older history pages are prepended and should never pull viewport to bottom.
    if (!isFetchingMore && newestChanged) {
      const isIncoming = user?.id ? last.senderId !== user.id : false;

      if (isIncoming) {
        if (isAtBottom) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          setNewMessageCount(0);
        } else {
          setNewMessageCount((count) => count + 1);
        }
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMessageCount(0);
      }
    }
  }, [displayMessages, user?.id, isFetchingMore, isAtBottom, isUserScrolling]);

  useEffect(() => {
    if (!displayTypingUsers.length) return;
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayTypingUsers.length, isAtBottom]);

  useEffect(() => {
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, [isAtBottom]);

  useEffect(() => {
    if (!targetMessageId) return;

    const targetMessage = displayMessages.find((message) => message.id === targetMessageId);
    if (targetMessage) {
      if (scrollTargetHandledRef.current === targetMessageId) return;

      scrollTargetHandledRef.current = targetMessageId;
      setHighlightMessageId(targetMessageId);

      const rafId = window.requestAnimationFrame(() => {
        const node = document.getElementById(`message-${targetMessageId}`);
        node?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      const timeoutId = window.setTimeout(() => {
        setHighlightMessageId((current) =>
          current === targetMessageId ? null : current
        );
      }, 4000);

      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(timeoutId);
      };
    }

    if (hasMore && !isFetchingMore) {
      fetchMore();
    }
  }, [
    targetMessageId,
    messages,
    hasMore,
    isFetchingMore,
    fetchMore,
  ]);

  // When opening a conversation, immediately mark all unread incoming messages as read.
  useEffect(() => {
    if (!user?.id || !displayMessages.length || !canMarkRead) return;

    // As soon as this visible, focused tab is viewing the conversation,
    // clear its local unread badge in the left conversation list.
    clearUnread(conversation.id);

    const unreadIncomingIds = displayMessages
      .filter((message) => {
        if (message.senderId === user.id) return false;
        if (message.unsent) return false;
        if (message.readBy.includes(user.id)) return false;
        return !emittedReadIdsRef.current.has(message.id);
      })
      .map((message) => message.id);

    if (!unreadIncomingIds.length) return;

    unreadIncomingIds.forEach((id) => emittedReadIdsRef.current.add(id));

    const socket = getChatSocket();
    socket.emit("message:read", {
      conversationId: conversation.id,
      messageIds: unreadIncomingIds,
    });
  }, [displayMessages, conversation.id, user?.id, canMarkRead, clearUnread]);

  // Participant lookup for group conversations
  const participantCount =
    conversation.type === "group"
      ? (conversation.group?.memberCount ?? 2)
      : 2;

  const latestReadOutgoingIndex = displayMessages.reduce((latest, msg, idx) => {
    if (msg.senderId !== user?.id) return latest;
    if (msg.pending || msg.failed || msg.unsent) return latest;
    const isReadByOther = (msg.readBy ?? []).some((readerId) => readerId !== user?.id);
    if (!isReadByOther) return latest;
    return idx;
  }, -1);

  const latestSentOutgoingIndex = displayMessages.reduce((latest, msg, idx) => {
    if (msg.senderId !== user?.id) return latest;
    if (msg.pending || msg.failed || msg.unsent) return latest;
    const isReadByOther = (msg.readBy ?? []).some((readerId) => readerId !== user?.id);
    if (isReadByOther) return latest;
    // If we already have a newer read anchor, avoid showing an older unread "Sent"
    // marker that can reveal hidden delivery windows (e.g. block period messages).
    if (latestReadOutgoingIndex >= 0 && idx <= latestReadOutgoingIndex) return latest;
    return idx;
  }, -1);

  if (isLoading) {
    return <LoadingSkeleton variant="message" rows={8} className="flex-1" />;
  }

  const handleJumpToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessageCount(0);
    setIsUserScrolling(false);
    setIsAtBottom(true);
  };

  return (
    <div className="relative flex-1 min-h-0">
      <ScrollArea
        className="h-full"
        viewportRef={viewportRef}
        onViewportScroll={handleViewportScroll}
      >
        <div className="flex min-h-full flex-col overflow-x-visible pr-1">
          {/* Load more sentinel at top */}
          <InfiniteScrollSentinel
            onLoadMore={() => fetchMore()}
            hasMore={hasMore ?? false}
            isLoading={isFetchingMore}
            className="pt-2"
          />

          <div className="flex-1" />

          {/* Hidden messages notice for new group members */}
          {myJoinedAt && displayMessages.length > 0 && (
            <div className="flex items-center justify-center py-3 px-4">
              <div className="px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground text-center">
                You joined this group on{" "}
                {new Date(myJoinedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Previous messages are not available.
              </div>
            </div>
          )}

          {/* Messages */}
          {displayMessages.map((message, index) => {
        const prev = displayMessages[index - 1];
        const next = displayMessages[index + 1];
        const showDivider = shouldShowDateDivider(prev?.createdAt, message.createdAt);
        const showTimeCluster = shouldShowTimeDivider(prev?.createdAt, message.createdAt);
        const isFirst = !prev || prev.senderId !== message.senderId || showDivider;
        const bucketKey = getTimeBucketKey(message.createdAt);

        const sameTimestampSenderAsPrev =
          !!prev &&
          prev.senderId === message.senderId &&
          getTimeBucketKey(prev.createdAt) === bucketKey;

        const sameTimestampSenderAsNext =
          !!next &&
          next.senderId === message.senderId &&
          getTimeBucketKey(next.createdAt) === bucketKey;

        const showAvatar = !sameTimestampSenderAsNext;

        let timestampBubblePosition: TimestampBubblePosition = "single";
        if (!sameTimestampSenderAsPrev && sameTimestampSenderAsNext) {
          timestampBubblePosition = "first";
        } else if (sameTimestampSenderAsPrev && sameTimestampSenderAsNext) {
          timestampBubblePosition = "middle";
        } else if (sameTimestampSenderAsPrev && !sameTimestampSenderAsNext) {
          timestampBubblePosition = "last";
        }

          let showReadReceipt = true;
          if (message.senderId === user?.id) {
            if (conversation.type === "private") {
              // Private chat: show at most two status markers:
              // 1) latest message read by the other person
              // 2) latest message sent but not yet read
              showReadReceipt =
                index === latestReadOutgoingIndex ||
                index === latestSentOutgoingIndex;
            } else {
              let nextMineIndex = -1;
              for (let i = index + 1; i < displayMessages.length; i += 1) {
                const candidate = displayMessages[i];
                if (candidate.senderId !== user?.id) continue;
                if (getTimeBucketKey(candidate.createdAt) !== bucketKey) continue;
                nextMineIndex = i;
                break;
              }

              if (nextMineIndex !== -1) {
                // Group chat: one status per 15-minute timestamp cluster.
                showReadReceipt = false;
              }
            }
          }

          let senderName: string | undefined;
          let senderImage: string | null = null;
          let senderAnonimiId: string | undefined;

          let canManageSender = false;
          let isSenderMuted = false;

          if (conversation.type === "group") {
            if (message.senderId !== user?.id) {
              const senderMeta = groupMemberMetaById[message.senderId];
              senderName = senderMeta?.name ?? "User";
              senderImage = senderMeta?.profileImage ?? null;
              senderAnonimiId = senderMeta?.anonimiId;

              if (currentUserRole) {
                const senderMembership = groupMembers.find(m => m.userId === message.senderId);
                if (senderMembership) {
                  const targetIsOwner = senderMembership.role === "owner";
                  const targetIsAdmin = senderMembership.role === "admin";
                  const isOwner = currentUserRole === "owner";
                  const isAdmin = currentUserRole === "admin";
                  canManageSender = isOwner || (isAdmin && !targetIsAdmin && !targetIsOwner);
                  isSenderMuted = !!senderMembership.mutedUntil;
                }
              }
            }
          } else if (conversation.type === "private" && message.senderId !== user?.id) {
            senderName = conversation.participant?.nickname ?? conversation.participant?.username ?? "User";
            senderImage = conversation.participant?.profileImage ?? null;
            senderAnonimiId = conversation.participant?.anonimiId;
          }

          return (
            <div key={message.id} id={`message-${message.id}`}>
              {showDivider && (
                <div className="flex items-center justify-center py-3">
                  <div className="px-3 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
                    <DateDisplay date={message.createdAt} format="date" className="text-xs text-muted-foreground" />
                  </div>
                </div>
              )}

              {showTimeCluster && (
                <div className="flex items-center justify-center py-1.5">
                  <div className="rounded-full border border-border/50 bg-background/75 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    <DateDisplay date={message.createdAt} format="time" className="text-[11px] text-muted-foreground" />
                  </div>
                </div>
              )}

              <MessageBubble
                message={message}
                isFirst={isFirst}
                showAvatar={showAvatar}
                senderName={senderName}
                senderImage={senderImage}
                senderAnonimiId={senderAnonimiId}
                participantCount={participantCount}
                conversationType={conversation.type}
                readByUsersById={reactionUserMetaById}
                showReadReceipt={showReadReceipt}
                timestampBubblePosition={timestampBubblePosition}
                isHighlighted={highlightMessageId === message.id}
                onEditStart={onEditStart}
                onReply={onReplyStart}
                canManageSender={canManageSender}
                isSenderMuted={isSenderMuted}
                onMuteRequest={(uid) => { setTargetUserId(uid); setMuteDuration(60); setMuteReason(""); setShowMuteDialog(true); }}
                onUnmuteRequest={(uid) => unmuteMember(uid)}
                onRemoveRequest={(uid) => { setTargetUserId(uid); setShowRemoveConfirm(true); }}
              />
            </div>
          );
        })}

          {/* Typing indicator */}
          <TypingIndicator users={displayTypingUsers} />

          <div ref={bottomRef} className="h-1" />
        </div>
      </ScrollArea>

      {newMessageCount > 0 && (
        <button
          type="button"
          onClick={handleJumpToBottom}
          className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-xs font-medium text-foreground shadow-elevated hover:bg-background"
        >
          New messages ({newMessageCount})
        </button>
      )}

      {showMuteDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMuteDialog(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm shadow-elevated animate-fade-in">
            <h3 className="text-base font-semibold mb-2">Mute Member</h3>
            <div className="space-y-3 mb-5">
              <Select value={muteDuration.toString()} onValueChange={(val) => setMuteDuration(Number(val))}>
                <SelectTrigger className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 mins</SelectItem>
                  <SelectItem value="30">30 mins</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="1440">1 day</SelectItem>
                </SelectContent>
              </Select>
              <textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder="Reason for muting (required)"
                className="w-full min-h-[80px] p-3 rounded-xl border border-border/60 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                maxLength={200}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMuteDialog(false)}
                className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (targetUserId) {
                    muteMember({ userId: targetUserId, durationMinutes: muteDuration, reason: muteReason.trim() });
                  }
                  setShowMuteDialog(false);
                }}
                disabled={!muteReason.trim()}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Mute
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => {
          if (targetUserId) removeMember(targetUserId);
        }}
        title="Remove Member?"
        description="This user will be immediately removed from the group."
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  );
}
