"use client";

import type { Message } from "@/types/message";
import { File, Music, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
  message: Message;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPreview({ message, className }: MediaPreviewProps) {
  if (!message.mediaUrl) return null;

  if (message.type === "image") {
    return (
      <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.mediaUrl}
          alt={message.fileName ?? "Image"}
          className={cn(
            "max-w-full max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity",
            className
          )}
        />
      </a>
    );
  }

  if (message.type === "video") {
    return (
      <div className="mb-1">
        <video
          src={message.mediaUrl}
          controls
          className={cn("max-w-full max-h-48 rounded-xl", className)}
        />
      </div>
    );
  }

  if (message.type === "audio") {
    return (
      <div className={cn("flex items-center gap-2 mb-1 min-w-[180px]", className)}>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-primary" />
        </div>
        <audio src={message.mediaUrl} controls className="flex-1 h-8" />
      </div>
    );
  }

  // Generic file
  return (
    <a
      href={message.mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 mb-1 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors",
        className
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
        <File className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{message.fileName ?? "File"}</p>
        {message.fileSize && (
          <p className="text-xs opacity-60">{formatBytes(message.fileSize)}</p>
        )}
      </div>
    </a>
  );
}
