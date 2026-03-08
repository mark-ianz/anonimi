"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useChatStore } from "@/stores/chatStore";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { FilePreview } from "@/components/shared/FileUpload";
import type { MessageType } from "@/types/message";

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  conversationId,
  disabled,
  placeholder = "Message...",
}: MessageInputProps) {
  const { sendMessage } = useMessages(conversationId);
  const { onInputChange, onBlur } = useTyping(conversationId);
  const { upload, isUploading, progress, cancel } = useMediaUpload();
  const { draftMessages, setDraft } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState(draftMessages[conversationId] ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Persist draft
  useEffect(() => {
    setDraft(conversationId, text);
  }, [text, conversationId, setDraft]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    if (disabled) return;

    let mediaUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let type: MessageType = "text";

    if (pendingFile) {
      const result = await upload(pendingFile, "message");
      if (!result) return;
      mediaUrl = result.url;
      fileName = result.fileName;
      fileSize = result.fileSize;
      type = ALLOWED_IMAGE_TYPES.includes(pendingFile.type)
        ? "image"
        : pendingFile.type.startsWith("video/")
        ? "video"
        : pendingFile.type.startsWith("audio/")
        ? "audio"
        : "file";
      setPendingFile(null);
    }

    sendMessage({
      conversationId,
      type,
      content: trimmed || null,
      mediaUrl,
      fileName,
      fileSize,
    });

    setText("");
    onBlur();
    textareaRef.current?.focus();
  }, [text, pendingFile, disabled, upload, sendMessage, conversationId, onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = (text.trim().length > 0 || pendingFile !== null) && !disabled;

  return (
    <div className="border-t border-border/50 p-3 bg-background">
      {/* File preview */}
      {pendingFile && (
        <div className="mb-2 px-1">
          <FilePreview
            file={pendingFile}
            onRemove={() => {
              setPendingFile(null);
              cancel();
            }}
            progress={isUploading ? progress : undefined}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach */}
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 mb-0.5"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onInputChange();
          }}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl bg-muted/50 border-0 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all max-h-[120px] leading-relaxed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Send */}
        <button
          type="button"
          disabled={!canSend || isUploading}
          onClick={handleSend}
          className={cn(
            "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
