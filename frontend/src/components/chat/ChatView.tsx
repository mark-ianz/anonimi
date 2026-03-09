"use client";

import { useEffect, useCallback } from "react";
import { ArrowLeft, MoreVertical, Phone, Video, UserPlus, Check, X, Clock } from "lucide-react";
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

interface ChatViewProps {
  conversation: Conversation;
}

function OnlineDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        status === "online" ? "bg-green-500" : "bg-muted-foreground/40"
      )}
    />
  );
}

export default function ChatView({ conversation }: ChatViewProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { setActiveConversation, clearUnread } = useChatStore();
  const { user: currentUser } = useAuthStore();

  const isGroup = conversation.type === "group";
  const participantId = conversation.participant?.id;
  const { status: presenceStatus, lastSeen } = usePresence(participantId);

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
  // Recipient can't type until they accept; sender can always type
  const isInputDisabled = isRecipient;

  useEffect(() => {
    setActiveConversation(conversation.id);
    clearUnread(conversation.id);
    return () => setActiveConversation(null);
  }, [conversation.id, setActiveConversation, clearUnread]);

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

  function getStatusText() {
    if (isGroup) return `${conversation.group?.memberCount ?? 0} members`;
    if (presenceStatus === "online") return "Online";
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
          <div className="w-9 h-9 rounded-full overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              (displayName?.[0] ?? "?").toUpperCase()
            )}
          </div>
          {!isGroup && (
            <span
              className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
                presenceStatus === "online" ? "bg-green-500" : "bg-muted-foreground/40"
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
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
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

      {/* Message list */}
      <MessageList conversation={conversation} />

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        disabled={isInputDisabled}
        placeholder={isInputDisabled ? "Accept the request to reply…" : "Message…"}
      />
    </div>
  );
}
