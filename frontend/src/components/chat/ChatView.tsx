"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, Phone, Video, UserPlus, Check, X, Clock, User, Pencil, ShieldBan, Flag, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { getChatSocket } from "@/lib/socket";
import api from "@/lib/api";
import type { Conversation } from "@/types/conversation";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConnectionStatus from "@/components/shared/ConnectionStatus";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import UserAvatar from "@/components/shared/UserAvatar";

interface ChatViewProps {
  conversation: Conversation;
}

export default function ChatView({ conversation }: ChatViewProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { setActiveConversation, clearUnread } = useChatStore();
  const { user: currentUser } = useAuthStore();

  // Header menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showNicknameForm, setShowNicknameForm] = useState(false);
  const [nicknameValue, setNicknameValue] = useState("");
  const [nicknameTarget, setNicknameTarget] = useState<"contact" | "self">("contact");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isGroup = conversation.type === "group";
  const participantId = conversation.participant?.id;
  const { status: presenceStatus, lastSeen } = usePresence(
    participantId,
    conversation.participant?.onlineStatus ?? "offline"
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
  const myBlockId = conversation.participant?.blockId ?? null;
  // Recipient can't type until they accept; sender can always type
  const isInputDisabled = isRecipient || isBlockedByMe;

  useEffect(() => {
    setActiveConversation(conversation.id);
    clearUnread(conversation.id);
    const socket = getChatSocket();
    socket.emit("conversation:active", { conversationId: conversation.id });

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
      socket.emit("conversation:active", { conversationId: null });
    };
  }, [conversation.id, setActiveConversation, clearUnread, qc]);

  // Listen for message-request:accepted event (shown to the sender when recipient accepts)
  useEffect(() => {
    if (!isPending && conversation.requestStatus !== "pending") return;
    const socket = getChatSocket();
    const handleAccepted = (data: { conversationId: string; requestStatus: string }) => {
      if (data.conversationId === conversation.id) {
        qc.invalidateQueries({ queryKey: ["conversations", conversation.id] });
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
      qc.invalidateQueries({ queryKey: ["conversations", conversation.id] });
      qc.invalidateQueries({ queryKey: ["message-requests"] });
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
      await api.post("/blocks", { targetEchoId: conversation.participant?.echoId });
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

  const nicknameMutation = useMutation({
    mutationFn: async (nickname: string | null) => {
      if (isGroup) {
        await api.patch(`/groups/${conversation.group?.id}/nickname`, { nickname });
      } else if (nicknameTarget === "self") {
        await api.patch(`/contacts/${conversation.participant!.contactId}/self-nickname`, { nickname });
      } else {
        await api.patch(`/contacts/${conversation.participant!.contactId}/nickname`, { nickname });
      }
    },
    onSuccess: () => {
      toast.success("Nickname updated.");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      if (!isGroup && conversation.participant?.echoId) {
        qc.invalidateQueries({ queryKey: ["user-profile", conversation.participant.echoId] });
      }
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", conversation.id] });
      qc.invalidateQueries({ queryKey: ["conversations", conversation.id] });
      qc.invalidateQueries({ queryKey: ["messages", conversation.id] });
      setShowNicknameForm(false);
    },
    onError: () => toast.error("Failed to update nickname."),
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
    if (isGroup) return `${conversation.group?.memberCount ?? 0} members`;
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
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border/50 shrink-0">
        {/* Back (mobile) */}
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          {isGroup ? (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {(displayName?.[0] ?? "?").toUpperCase()}
            </div>
          ) : (
            <UserAvatar
              imageUrl={displayImage}
              name={displayName}
              alt={displayName}
              className="w-9 h-9"
              textClassName="text-sm"
            />
          )}
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

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground leading-tight">{getStatusText()}</p>
        </div>

        <ConnectionStatus />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
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
              <div className="absolute right-0 z-20 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-44 animate-fade-in">
                {!isGroup && (
                  <Link
                    href={`/user/${conversation.participant?.echoId}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    View profile
                  </Link>
                )}

                {/* Set Nickname — for contacts (private) or groups */}
                {(!isGroup && conversation.participant?.contactId) || isGroup ? (
                  <button
                    onClick={() => {
                      setNicknameTarget("contact");
                      setNicknameValue(
                        isGroup
                          ? (conversation.group?.name ?? "")
                          : (conversation.participant?.nickname ?? "")
                      );
                      setMenuOpen(false);
                      setShowNicknameForm(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                    Set nickname
                  </button>
                ) : null}

                {!isGroup && conversation.participant?.contactId ? (
                  <button
                    onClick={() => {
                      setNicknameTarget("self");
                      setNicknameValue("");
                      setMenuOpen(false);
                      setShowNicknameForm(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                    Set my nickname
                  </button>
                ) : null}

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
                        onClick={() => { setMenuOpen(false); setConfirmBlock(true); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <ShieldBan className="w-4 h-4 shrink-0" />
                        Block user
                      </button>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); setShowReportForm(true); }}
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
                    <div className="my-1 border-t border-border/30" />
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

      {/* Non-contact notice banner — recipient view */}
      {isRecipient && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-base leading-none mt-0.5">📩</span>
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

      {/* Non-contact notice banner — sender view */}
      {isSender && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/50 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Your message is a request — <span className="text-foreground font-medium">{displayName}</span> hasn&apos;t accepted yet.
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
              onClick={() => setShowReportForm(true)}
              className="h-8 px-3 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              Report
            </button>
            <button
              disabled
              title="Archive coming soon"
              className="h-8 px-3 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground cursor-not-allowed"
            >
              Archive (soon)
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <MessageList conversation={conversation} />

      {/* Input */}
      <div className="mt-4">
        <MessageInput
          conversationId={conversation.id}
          disabled={isInputDisabled}
          placeholder={
            isBlockedByMe
              ? "Unblock this user to send messages..."
              : isRecipient
              ? "Accept the request to reply..."
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

      {/* Nickname modal */}
      {showNicknameForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNicknameForm(false); }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm shadow-elevated animate-fade-in">
            <h3 className="font-display font-semibold text-base mb-1">Set nickname</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {nicknameTarget === "self"
                ? "Visible to the other person in this chat. Leave empty to remove."
                : "Only visible to you. Leave empty to remove."}
            </p>
            <input
              autoFocus
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !nicknameMutation.isPending) {
                  nicknameMutation.mutate(nicknameValue.trim() || null);
                }
                if (e.key === "Escape") setShowNicknameForm(false);
              }}
              maxLength={50}
              className="w-full h-10 px-3 rounded-xl bg-muted/60 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 mb-4"
              placeholder={
                nicknameTarget === "self"
                  ? "Your nickname for them to see…"
                  : `Nickname for ${displayName}…`
              }
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNicknameForm(false)}
                disabled={nicknameMutation.isPending}
                className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => nicknameMutation.mutate(nicknameValue.trim() || null)}
                disabled={nicknameMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {nicknameMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
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
                <option value="">Select a reason…</option>
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
                placeholder="Additional details (optional)…"
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
                {reportMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
