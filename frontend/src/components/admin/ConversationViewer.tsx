"use client";

import { API_BASE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ConversationMessage {
  id: string;
  senderId: string;
  senderUsername?: string;
  type: string;
  content: string | null;
  mediaUrl?: string | null;
  unsent: boolean;
  createdAt: string;
}

interface ConversationViewerProps {
  messages: ConversationMessage[];
  highlightUserId?: string;
}

export default function ConversationViewer({ messages, highlightUserId }: ConversationViewerProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No messages
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {messages.map((msg) => {
        const isHighlighted = highlightUserId && msg.senderId === highlightUserId;

        return (
          <div
            key={msg.id}
            className={cn(
              "rounded-xl p-3 text-sm space-y-1",
              msg.unsent
                ? "bg-destructive/10 border border-destructive/20"
                : isHighlighted
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/30 border border-border/20"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs text-muted-foreground">
                {msg.senderUsername ?? msg.senderId.slice(-8)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>

            {msg.unsent ? (
              <p className="text-destructive text-xs italic">
                [Unsent] {msg.content ?? "(content unavailable)"}
              </p>
            ) : msg.content ? (
              <p className="break-words whitespace-pre-wrap">{msg.content}</p>
            ) : null}

            {msg.mediaUrl && (
              <div className="mt-1">
                {msg.type === "image" ? (
                  <img
                    src={`${API_BASE.replace("/api", "")}${msg.mediaUrl}`}
                    alt="media"
                    className="max-h-40 rounded-lg object-cover"
                  />
                ) : (
                  <a
                    href={`${API_BASE.replace("/api", "")}${msg.mediaUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    View attachment
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-md text-muted-foreground">
                {msg.type}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
