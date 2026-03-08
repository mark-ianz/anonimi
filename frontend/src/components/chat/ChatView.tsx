"use client";

import { useEffect } from "react";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import { useChatStore } from "@/stores/chatStore";
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
  const { setActiveConversation, clearUnread } = useChatStore();

  const isGroup = conversation.type === "group";
  const participantId = conversation.participant?.id;
  const { status: presenceStatus, lastSeen } = usePresence(participantId);

  const displayName = isGroup
    ? conversation.group?.name
    : conversation.participant?.nickname ?? conversation.participant?.username ?? "Unknown";

  const displayImage = isGroup ? conversation.group?.image : conversation.participant?.profileImage;

  useEffect(() => {
    setActiveConversation(conversation.id);
    clearUnread(conversation.id);
    return () => setActiveConversation(null);
  }, [conversation.id, setActiveConversation, clearUnread]);

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

  const isDisabled = conversation.requestStatus === "pending";

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
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
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

      {/* Message request notice */}
      {isDisabled && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/50 text-sm text-center text-muted-foreground">
          This is a message request. Accept it to reply.
        </div>
      )}

      {/* Message list */}
      <MessageList conversation={conversation} />

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        disabled={isDisabled}
        placeholder={isDisabled ? "Accept request to reply" : "Message..."}
      />
    </div>
  );
}
