"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MoreVertical, Phone, Video, UserPlus, Check, X, Clock, User, ShieldBan, Flag, LogOut, Settings, Users, Archive, BellOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { getChatSocket } from "@/lib/socket";
import api from "@/lib/api";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { GroupMember } from "@/types/group";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConnectionStatus from "@/components/shared/ConnectionStatus";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import GroupAvatar from "@/components/shared/GroupAvatar";
import UserAvatar from "@/components/shared/UserAvatar";
import TemporaryAccountBadge from "@/components/shared/TemporaryAccountBadge";
import TemporaryAccountModal from "@/components/shared/TemporaryAccountModal";
import { useE2EEKeyExchange } from "@/hooks/useE2EEKeyExchange";
import { useGroupKeyExchange, useGroupKeyReception } from "@/hooks/useGroupKeyExchange";

interface ChatViewProps {
  conversation: Conversation;
  backHref?: "/chat" | "/archive";
}

export default function ChatView({ conversation, backHref = "/chat" }: ChatViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { setActiveConversation, clearUnread, conversations, setConversations, setMessages } = useChatStore();
  const { user: currentUser } = useAuthStore();

  // Header menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; content: string } | null>(null);
  const [tempGateOpen, setTempGateOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  const isGroup = conversation.type === "group";
  const isGroupDisbanded = isGroup && !!conversation.group?.disbandedAt;
  const participantId = conversation.participant?.id;
  const groupId = conversation.group?.id ?? null;
  const isTempParticipant = !isGroup && !!conversation.participant?.isTemporary;
  const isDeletedParticipant = !isGroup && !!conversation.participant?.isDeleted;
  const isTempUser = !!currentUser?.isTemporary;
  const { status: presenceStatus, lastSeen } = usePresence(
    participantId,
    conversation.participant?.onlineStatus ?? "offline"
  );

  useE2EEKeyExchange(
    conversation.id,
    isGroup ? null : (participantId ?? null)
  );

  useGroupKeyExchange(
    isGroup ? conversation.id : null,
    isGroup ? groupId : null
  );

  const displayName = isGroup
    ? conversation.group?.name
    : conversation.participant?.nickname ?? conversation.participant?.username ?? "Unknown";

  const displayImage = isGroup ? conversation.group?.image : conversation.participant?.profileImage;

  // Determine sender vs recipient role for message request gating.
  // requestFromUserId is null until the first message is sent (MessageRequest document
  // is created lazily). A null value means the conversation was just initiated by the
  // current user, so treat it as "sender" to show the correct informational banner.
  const isPending = conversation.requestStatus === "pending";
  const isSender = isPending && (conversation.requestFromUserId == null || conversation.requestFromUserId === currentUser?.id);
  const isRecipient = isPending && !isSender;
  const isBlockedByMe = !isGroup && !!conversation.participant?.blockedByMe;
  const isArchived = !!conversation.isArchived;
  const isConversationMuted = !!conversation.isMuted && (!conversation.mutedUntil || new Date(conversation.mutedUntil).getTime() > Date.now());
  const myBlockId = conversation.participant?.blockId ?? null;
  // Recipient can't type until they accept; sender can always type
  const isInputDisabled = isRecipient || isBlockedByMe || isGroupDisbanded || isDeletedParticipant;

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data.data as GroupMember[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });

  const currentMember = groupMembers.find((member) => member.userId === currentUser?.id);
  const groupMutedUntil = currentMember?.mutedUntil ? new Date(currentMember.mutedUntil) : null;
  const isGroupMuted = !!groupMutedUntil && groupMutedUntil.getTime() > Date.now();
  const isInputDisabledWithMute = isInputDisabled || isGroupMuted;

  const handleEditStart = (message: { id: string; content: string | null }) => {
    setEditTarget({ id: message.id, content: message.content ?? "" });
    setReplyTarget(null);
  };

  const handleEditCancel = () => {
    setEditTarget(null);
  };

  const handleEditSaved = () => {
    setEditTarget(null);
  };

  useEffect(() => {
    setActiveConversation(conversation.id);
    clearUnread(conversation.id);
    const socket = getChatSocket();
    socket.emit("conversation:join", { conversationId: conversation.id });
    socket.emit("conversation:active", { conversationId: conversation.id });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage({
            type: "close-notifications",
            conversationId: conversation.id,
          });
        })
        .catch(() => undefined);
    }

    api
      .patch(`/notifications/messages/read-by-conversation/${conversation.id}`)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => {
        // Keep UX smooth; this sync call is best-effort.
      });

    return () => {
      setActiveConversation(null);
      socket.emit("conversation:leave", { conversationId: conversation.id });
      socket.emit("conversation:active", { conversationId: null });
    };
  }, [conversation.id, setActiveConversation, clearUnread, qc]);

  useEffect(() => {
    setEditTarget(null);
    setReplyTarget(null);
  }, [conversation.id]);

  // Listen for message-request:accepted event (shown to the sender when recipient accepts)
  useEffect(() => {
    if (!isPending && conversation.requestStatus !== "pending") return;
    const socket = getChatSocket();
    const handleAccepted = (data: { conversationId: string; requestStatus: string }) => {
      if (data.conversationId === conversation.id) {
        qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    };
    socket.on("message-request:accepted", handleAccepted);
    return () => { socket.off("message-request:accepted", handleAccepted); };
  }, [conversation.id, isPending, conversation.requestStatus, qc]);

  const acceptMutation = useMutation({
    mutationFn: async ({ addToContacts }: { addToContacts: boolean }) => {
      const res = await api.patch(`/message-requests/${conversation.requestId}/accept`, {
        addToContacts,
      });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      toast.success("Message request accepted.");
    },
    onError: () => toast.error("Failed to accept request."),
  });

  const ignoreMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/message-requests/${conversation.requestId}/ignore`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      toast.success("Request ignored.");
      router.push("/chat");
    },
    onError: () => toast.error("Failed to ignore request."),
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post("/blocks", { targetAnonimiId: conversation.participant?.anonimiId });
    },
    onSuccess: () => {
      setConfirmBlock(false);
      toast.success(`${displayName} has been blocked.`);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
    },
    onError: () => toast.error("Failed to block user."),
  });

  const unblockMutation = useMutation({
    mutationFn: async () => {
      if (!myBlockId) throw new Error("Missing block id");
      await api.delete(`/blocks/${myBlockId}`);
    },
    onSuccess: () => {
      toast.success(`${displayName} has been unblocked.`);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
    },
    onError: () => toast.error("Failed to unblock user."),
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      await api.post("/reports", {
        targetType: "user",
        targetId: conversation.participant?.id,
        reason: reportReason,
        description: reportDescription || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Report submitted. Thank you.");
      setShowReportForm(false);
      setReportReason("");
      setReportDescription("");
    },
    onError: () => toast.error("Failed to submit report."),
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/groups/${conversation.group?.id}/leave`);
    },
    onSuccess: () => {
      toast.success(`You left "${conversation.group?.name}".`);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      router.push("/chat");
    },
    onError: () => toast.error("Failed to leave group."),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${conversation.id}/archive`);
    },
    onSuccess: () => {
      qc.setQueryData(["conversation", conversation.id], (old: Conversation | undefined) =>
        old ? { ...old, isArchived: true } : old
      );
      toast.success("Conversation archived.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      router.push("/archive");
    },
    onError: () => toast.error("Failed to archive conversation."),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}/archive`);
    },
    onSuccess: () => {
      qc.setQueryData(["conversation", conversation.id], (old: Conversation | undefined) =>
        old ? { ...old, isArchived: false } : old
      );
      toast.success("Conversation moved to Chats.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      router.push(`/chat/${conversation.id}`);
    },
    onError: () => toast.error("Failed to unarchive conversation."),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}`);
    },
    onSuccess: () => {
      // Optimistic local cleanup for instant UI update
      setConversations(conversations.filter((c) => c.id !== conversation.id));
      setMessages(conversation.id, []);
      clearUnread(conversation.id);

      qc.removeQueries({ queryKey: ["messages", conversation.id] });
      qc.removeQueries({ queryKey: ["conversation", conversation.id] });

      toast.success("Conversation deleted.");
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });

      setConfirmDelete(false);
      setDeleteConfirmText("");
      setMenuOpen(false);
      router.push("/chat");
    },
    onError: () => toast.error("Failed to delete conversation."),
  });

  const muteConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/conversations/${conversation.id}/mute`, {});
      return res.data.data as { mutedUntil?: string | null };
    },
    onSuccess: (data) => {
      const mutedUntil = data?.mutedUntil ?? null;
      qc.setQueryData(["conversation", conversation.id], (old: Conversation | undefined) =>
        old ? { ...old, isMuted: true, mutedUntil } : old
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      setConversations(conversations.map((conv) =>
        conv.id === conversation.id ? { ...conv, isMuted: true, mutedUntil } : conv
      ));
      clearUnread(conversation.id);
      toast.success("Conversation muted.");
    },
    onError: () => toast.error("Failed to mute conversation."),
  });

  const unmuteConversationMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${conversation.id}/mute`);
    },
    onSuccess: () => {
      qc.setQueryData(["conversation", conversation.id], (old: Conversation | undefined) =>
        old ? { ...old, isMuted: false, mutedUntil: null } : old
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "active"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
      setConversations(conversations.map((conv) =>
        conv.id === conversation.id ? { ...conv, isMuted: false, mutedUntil: null } : conv
      ));
      toast.success("Conversation unmuted.");
    },
    onError: () => toast.error("Failed to unmute conversation."),
  });

  const handleMessageSent = () => {
    if (!isArchived) return;

    qc.setQueryData(["conversation", conversation.id], (old: Conversation | undefined) =>
      old ? { ...old, isArchived: false } : old
    );
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["conversations", "active"] });
    qc.invalidateQueries({ queryKey: ["conversations", "archived"] });
    qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });

    if (pathname?.startsWith("/archive")) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function getStatusText() {
    if (isGroup) {
      if (isGroupDisbanded) return "Disbanded";
      return `${conversation.group?.memberCount ?? 0} members`;
    }
    if (presenceStatus === "online") return "Online";
    if (presenceStatus === "away") return "Away";
    if (presenceStatus === "dnd") return "Do Not Disturb";
    if (lastSeen) {
      const date = new Date(lastSeen);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Last seen just now";
      if (minutes < 60) return `Last seen ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Last seen ${hours}h ago`;
      return `Last seen ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
    return "Offline";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="relative z-40 flex items-center gap-3 px-4 h-14 border-b border-border/50 shrink-0">
        {/* Back (mobile) */}
        <button
          onClick={() => router.push(backHref)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar + name + status */}
        {isGroup && conversation.group?.id ? (
          <Link
            href={`/groups/${conversation.group.id}/settings`}
            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
          >
            <div className="relative shrink-0">
              <GroupAvatar
                imageUrl={displayImage}
                fallbackProfileImages={conversation.group?.fallbackProfileImages}
                name={displayName}
                alt={displayName}
                className="w-9 h-9"
                roundedClassName="rounded-full"
                textClassName="text-sm"
              />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <p className="font-medium text-sm leading-tight truncate">{displayName}</p>
              {isConversationMuted && (
                <BellOff className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
              )}
            </div>
          </Link>
        ) : (
          <>
            <div className="relative shrink-0">
              <UserAvatar
                imageUrl={displayImage}
                name={displayName}
                alt={displayName}
                className="w-9 h-9"
                textClassName="text-sm"
              />
              {!isGroup && (
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <p className="font-medium text-sm leading-tight truncate">{displayName}</p>
                  {isConversationMuted && (
                    <BellOff className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                  )}
                </div>
                {isTempParticipant && !isDeletedParticipant && (
                  <TemporaryAccountBadge />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{getStatusText()}</p>
            </div>
          </>
        )}

        <ConnectionStatus />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toast.info("Calling is not implemented yet.")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.info("Video calls are not implemented yet.")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors",
                menuOpen && "bg-muted text-foreground"
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-44 animate-fade-in">
                {!isGroup && (
                  <Link
                    href={`/user/${conversation.participant?.anonimiId}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    onClick={(event) => {
                      if (isDeletedParticipant) {
                        event.preventDefault();
                        return;
                      }
                      setMenuOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    View profile
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (isArchived) {
                      unarchiveMutation.mutate();
                    } else {
                      archiveMutation.mutate();
                    }
                  }}
                  disabled={archiveMutation.isPending || unarchiveMutation.isPending}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
                  {isArchived
                    ? unarchiveMutation.isPending
                      ? "Unarchiving..."
                      : "Unarchive"
                    : archiveMutation.isPending
                    ? "Archiving..."
                    : "Archive"}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (isConversationMuted) {
                      unmuteConversationMutation.mutate();
                    } else {
                      muteConversationMutation.mutate();
                    }
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
                  {isConversationMuted ? "Unmute" : "Mute"}
                </button>

                {!isGroup && (
                  <>
                    <div className="my-1 border-t border-border/30" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                        setDeleteConfirmText("");
                      }}
                      disabled={deleteConversationMutation.isPending}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      {deleteConversationMutation.isPending ? "Deleting..." : "Delete Conversation"}
                    </button>
                  </>
                )}

                {/* Private-only: block + report */}
                {!isGroup && (
                  <>
                    <div className="my-1 border-t border-border/30" />
                    {isBlockedByMe ? (
                      <button
                        onClick={() => { setMenuOpen(false); unblockMutation.mutate(); }}
                        disabled={unblockMutation.isPending || !myBlockId}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
                      >
                        <ShieldBan className="w-4 h-4 shrink-0 text-muted-foreground" />
                        {unblockMutation.isPending ? "Unblocking..." : "Unblock user"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          if (isTempUser) {
                            setTempGateOpen(true);
                            return;
                          }
                          setConfirmBlock(true);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <ShieldBan className="w-4 h-4 shrink-0" />
                        Block user
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (isTempUser) {
                          setTempGateOpen(true);
                          return;
                        }
                        setShowReportForm(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Flag className="w-4 h-4 shrink-0" />
                      Report user
                    </button>
                  </>
                )}

                {/* Group-only: leave */}
                {isGroup && (
                  <>
                    {!isGroupDisbanded && conversation.group?.id && (
                      <Link
                        href={`/groups/${conversation.group.id}/settings?tab=members`}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                        Add member
                      </Link>
                    )}
                    {!isGroupDisbanded && conversation.group?.id && (
                      <Link
                        href={`/groups/${conversation.group.id}/settings`}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                        Group settings
                      </Link>
                    )}
                    {!isGroupDisbanded && conversation.group?.id && (
                      <Link
                        href={`/groups/${conversation.group.id}/settings?tab=members`}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        View members
                      </Link>
                    )}
                    <div className="my-1 border-t border-border/30" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                        setDeleteConfirmText("");
                      }}
                      disabled={deleteConversationMutation.isPending}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      {deleteConversationMutation.isPending ? "Deleting..." : "Delete Conversation"}
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmLeave(true); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Leave group
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {isGroupMuted && (
        <div className="mx-4 mt-3 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-foreground">You are muted in this group</p>
          <div className="mt-1 space-y-1">
            {currentMember?.muteReason && (
              <p className="text-sm font-medium text-destructive">
                Reason: {currentMember.muteReason}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              You cannot send messages until {groupMutedUntil?.toLocaleString() ?? "unmuted"}.
            </p>
          </div>
        </div>
      )}

      {!isGroup && isTempParticipant && !isDeletedParticipant && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-foreground">Temporary account</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be cautious when sharing sensitive details. This account can be deleted after 24 hours.
          </p>
        </div>
      )}

      {!isGroup && isDeletedParticipant && (
        <div className="mx-4 mt-3 rounded-xl border border-border/60 bg-muted/50 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-foreground">Deleted temporary user</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This temporary account has been deleted. Message history is still visible, but you can&apos;t send new messages.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => (isArchived ? unarchiveMutation.mutate() : archiveMutation.mutate())}
              disabled={archiveMutation.isPending || unarchiveMutation.isPending}
              className="h-8 px-3 rounded-lg border border-border/50 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(true);
                setDeleteConfirmText("");
              }}
              disabled={deleteConversationMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-destructive/40 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteConversationMutation.isPending ? "Deleting..." : "Delete Conversation"}
            </button>
          </div>
        </div>
      )}

      {/* Non-contact notice banner - recipient view */}
      {isRecipient && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-base leading-none mt-0.5">!</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Message request from {displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {displayName} is not in your contacts. Accept to reply.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => acceptMutation.mutate({ addToContacts: false })}
              disabled={acceptMutation.isPending || !conversation.requestId}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              onClick={() => acceptMutation.mutate({ addToContacts: true })}
              disabled={acceptMutation.isPending || !conversation.requestId}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Accept &amp; Add Contact
            </button>
            <button
              onClick={() => ignoreMutation.mutate()}
              disabled={ignoreMutation.isPending}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-destructive transition-colors disabled:opacity-50 ml-auto"
              title="Ignore request"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isGroupDisbanded && (
        <div className="mx-4 mt-3 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 shrink-0">
          <p className="text-sm font-medium text-foreground">This group has been disbanded.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Chat history remains visible, but messaging is disabled.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => (isArchived ? unarchiveMutation.mutate() : archiveMutation.mutate())}
              disabled={archiveMutation.isPending || unarchiveMutation.isPending}
              className="h-8 px-3 rounded-lg border border-border/50 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(true);
                setDeleteConfirmText("");
              }}
              disabled={deleteConversationMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-destructive/40 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteConversationMutation.isPending ? "Deleting..." : "Delete Conversation"}
            </button>
          </div>
        </div>
      )}

      {/* Non-contact notice banner - sender view */}
      {isSender && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/50 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Your message is a request - <span className="text-foreground font-medium">{displayName}</span> hasn&apos;t accepted yet.
              You can keep sending messages while you wait.
            </span>
          </div>
        </div>
      )}

      {/* Blocked by you banner */}
      {isBlockedByMe && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 shrink-0 space-y-3">
          <p className="text-sm font-medium text-foreground">
            You blocked {displayName}. You can&apos;t send messages in this conversation.
          </p>
          <p className="text-xs text-muted-foreground">
            They can still send messages, but you will not receive anything sent while this block is active.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => unblockMutation.mutate()}
              disabled={unblockMutation.isPending || !myBlockId}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {unblockMutation.isPending ? "Unblocking..." : "Unblock"}
            </button>
            <button
              onClick={() => {
                if (isTempUser) {
                  setTempGateOpen(true);
                  return;
                }
                setShowReportForm(true);
              }}
              className="h-8 px-3 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              Report
            </button>
            <button
              onClick={() => (isArchived ? unarchiveMutation.mutate() : archiveMutation.mutate())}
              disabled={archiveMutation.isPending || unarchiveMutation.isPending}
              className="h-8 px-3 rounded-lg border border-border/50 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleteConversationMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-destructive/40 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteConversationMutation.isPending ? "Deleting..." : "Delete Chat"}
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <MessageList
        conversation={conversation}
        onEditStart={handleEditStart}
        onReplyStart={(message) => setReplyTarget(message)}
      />

      {/* Input */}
      <div className="mt-4">
        <MessageInput
          conversationId={conversation.id}
          disabled={isInputDisabledWithMute}
          onMessageSent={handleMessageSent}
          editMessageId={editTarget?.id ?? null}
          editContent={editTarget?.content ?? ""}
          onCancelEdit={handleEditCancel}
          onEditSaved={handleEditSaved}
          replyTo={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
          placeholder={
            isBlockedByMe
              ? "Unblock this user to send messages..."
              : isDeletedParticipant
              ? "This temporary account was deleted..."
              : isGroupDisbanded
              ? "This group has been disbanded..."
              : isRecipient
              ? "Accept the request to reply..."
              : isGroupMuted
              ? "You are muted in this group..."
              : "Message..."
          }
        />
      </div>

      {/* Block confirm */}
      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => blockMutation.mutate()}
        title={`Block ${displayName}?`}
        description="You won't receive their new messages while blocked, and you won't be able to send them messages until you unblock."
        confirmLabel="Block"
        variant="destructive"
        loading={blockMutation.isPending}
      />

      {/* Leave group confirm */}
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => leaveGroupMutation.mutate()}
        title={`Leave "${conversation.group?.name}"?`}
        description="You will no longer be a member of this group."
        confirmLabel="Leave"
        variant="destructive"
        loading={leaveGroupMutation.isPending}
      />

      {confirmDelete && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (deleteConversationMutation.isPending) return;
                setConfirmDelete(false);
                setDeleteConfirmText("");
              }}
            />

            <div className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated space-y-4">
              <h3 className="font-display font-semibold text-base text-destructive">Delete Conversation</h3>
              <p className="text-sm text-muted-foreground">
                This clears your existing messages in this conversation. New messages can make it appear again.
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
                    setConfirmDelete(false);
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
                  {deleteConversationMutation.isPending ? "Deleting..." : "Delete Conversation"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Report modal */}
      {showReportForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReportForm(false); setReportReason(""); setReportDescription(""); } }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm shadow-elevated animate-fade-in">
            <h3 className="font-display font-semibold text-base mb-1">Report {displayName}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Your report is anonymous and will be reviewed by our team.
            </p>
            <div className="space-y-3 mb-5">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-muted/60 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or unwanted messages</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="hate_speech">Hate speech</option>
                <option value="impersonation">Impersonation</option>
                <option value="inappropriate_content">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                placeholder="Additional details (optional)..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReportForm(false); setReportReason(""); setReportDescription(""); }}
                disabled={reportMutation.isPending}
                className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={!reportReason || reportMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {reportMutation.isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <TemporaryAccountModal
        open={tempGateOpen}
        onClose={() => setTempGateOpen(false)}
      />
    </div>
  );
}
