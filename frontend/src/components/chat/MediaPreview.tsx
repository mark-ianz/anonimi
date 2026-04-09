"use client";

import { useState } from "react";
import type { Message } from "@/types/message";
import { File, Music, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import InAppMediaViewer from "@/components/shared/InAppMediaViewer";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  if (!message.mediaUrl) return null;
  const mediaUrl = resolveMediaUrl(message.mediaUrl);

  if (message.type === "image") {
    return (
      <>
        <button
          type="button"
          className="mb-1 block cursor-pointer text-left"
          onClick={(event) => {
            event.stopPropagation();
            setViewerOpen(true);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={message.fileName ?? "Image"}
            className={cn(
              "max-h-64 max-w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity",
              className
            )}
          />
        </button>
        {viewerOpen && (
          <InAppMediaViewer
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            src={mediaUrl}
            type="image"
            alt={message.fileName ?? "Image"}
          />
        )}
      </>
    );
  }

  if (message.type === "video") {
    return (
      <>
        <button
          type="button"
          className={cn(
            "group mb-1 block cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-black/35 text-white hover:bg-black/50 transition-colors",
            className
          )}
          onClick={(event) => {
            event.stopPropagation();
            setViewerOpen(true);
          }}
        >
          <div className="relative">
            <video
              src={mediaUrl}
              muted
              playsInline
              preload="metadata"
              className="max-h-56 w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/45 transition-colors">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                <Play className="h-3.5 w-3.5 fill-current" />
                Play video
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Video className="h-4 w-4" />
            <span className="truncate text-xs font-medium">
              {message.fileName ?? "Video"}
            </span>
          </div>
        </button>
        {viewerOpen && (
          <InAppMediaViewer
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            src={mediaUrl}
            type="video"
            alt={message.fileName ?? "Video"}
          />
        )}
      </>
    );
  }

  if (message.type === "audio") {
    return (
      <div className={cn("flex items-center gap-2 mb-1 min-w-45", className)}>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-primary" />
        </div>
        <audio src={mediaUrl} controls className="flex-1 h-8" />
      </div>
    );
  }

  // Generic file
  return (
    <a
      href={mediaUrl}
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
