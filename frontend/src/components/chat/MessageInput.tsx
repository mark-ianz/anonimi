"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useChatStore } from "@/stores/chatStore";
import { ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { FilePreview } from "@/components/shared/FileUpload";
import type { Message, MessageType, ReplyPreview } from "@/types/message";
import type { UploadSource } from "@/lib/uploadPolicy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEALTH_DURATIONS = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "3h",
  "6h",
  "12h",
  "24h",
] as const;
type StealthDuration = (typeof STEALTH_DURATIONS)[number];

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
  placeholder?: string;
  onMessageSent?: () => void;
  editMessageId?: string | null;
  editContent?: string;
  onCancelEdit?: () => void;
  onEditSaved?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

const MAX_MESSAGE_LENGTH = 256;

export default function MessageInput({
  conversationId,
  disabled,
  placeholder = "Message...",
  onMessageSent,
  editMessageId = null,
  editContent = "",
  onCancelEdit,
  onEditSaved,
  replyTo = null,
  onCancelReply,
}: MessageInputProps) {
  const { sendMessage, editMessageAsync, isEditingMessage } = useMessages(conversationId);
  const { onInputChange, onBlur } = useTyping(conversationId);
  const { upload, isUploading, progress, cancel } = useMediaUpload();
  const { draftMessages, setDraft } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevDraftRef = useRef<string>("");
  const lastEditIdRef = useRef<string | null>(null);

  const [text, setText] = useState(draftMessages[conversationId] ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingSource, setPendingSource] = useState<UploadSource>("file");
  const [stealthEnabled, setStealthEnabled] = useState(false);
  const [stealthDuration, setStealthDuration] = useState<StealthDuration>("5m");
  const replyToId = replyTo?.id ?? null;

  const resolveReplyPreviewContent = (message: Message) => {
    if (message.unsent) return "Message removed";
    if (message.isStealth) return "[Stealth]";
    if (message.type === "image") return "Photo";
    if (message.type === "video") return "Video";
    if (message.type === "audio") return "Audio";
    if (message.type === "file") return message.fileName || "File";
    if (message.content) return message.content;
    if (message.isE2ee && message.contentCipher) return "Decrypting...";
    return "Message unavailable";
  };

  const replyPreview: ReplyPreview | null = replyTo
    ? {
        messageId: replyTo.id,
        senderId: replyTo.senderId ?? null,
        senderUsername: null,
        type: replyTo.type,
        content: resolveReplyPreviewContent(replyTo),
        mediaUrl: replyTo.mediaUrl ?? null,
        fileName: replyTo.fileName ?? null,
        createdAt: replyTo.createdAt,
      }
    : null;

  useEffect(() => {
    if (!editMessageId) {
      lastEditIdRef.current = null;
      return;
    }

    setStealthEnabled(false);

    if (lastEditIdRef.current === editMessageId) return;
    lastEditIdRef.current = editMessageId;

    prevDraftRef.current = draftMessages[conversationId] ?? text;
    setText(editContent);
    setPendingFile(null);
    setPendingSource("file");
    const frame = window.requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus({ preventScroll: true });
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editMessageId, editContent, conversationId, draftMessages, text]);

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

  // Focus input whenever user opens/switches conversations.
  useEffect(() => {
    if (disabled) return;

    const frame = window.requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus({ preventScroll: true });
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversationId, disabled]);

  // When user taps "Reply", focus the input so they can start typing immediately.
  useEffect(() => {
    if (disabled) return;
    if (!replyToId) return;
    if (editMessageId) return;

    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [replyToId, disabled, editMessageId]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, source: UploadSource) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setPendingSource(source);
    }
    e.target.value = "";
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (disabled || !!editMessageId) return;

      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const itemFile = imageItem?.getAsFile() ?? null;
      const fileFromFiles =
        Array.from(event.clipboardData.files).find((fileItem) =>
          fileItem.type.startsWith("image/")
        ) ?? null;
      const file = itemFile ?? fileFromFiles;
      if (!file) return;

      event.preventDefault();
      setPendingFile(file);
      setPendingSource("file");
      if (stealthEnabled) {
        setStealthEnabled(false);
      }
    },
    [disabled, editMessageId, stealthEnabled]
  );

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    if (disabled) return;

    if (editMessageId) {
      await editMessageAsync({
        messageId: editMessageId,
        content: trimmed,
        conversationId,
      });
      setText("");
      onBlur();
      onEditSaved?.();
      textareaRef.current?.focus();
      return;
    }

    let mediaUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let type: MessageType = "text";

    if (pendingFile) {
      const result = await upload(pendingFile, "message", { source: pendingSource });
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
      setPendingSource("file");
    }

    sendMessage({
      conversationId,
      type,
      content: trimmed || null,
      mediaUrl,
      fileName,
      fileSize,
      replyToId: replyTo?.id ?? null,
      replyPreview,
      stealthDuration: stealthEnabled ? stealthDuration : undefined,
    });

    onMessageSent?.();
    onCancelReply?.();

    setText("");
    onBlur();
    textareaRef.current?.focus();
  }, [
    text,
    pendingFile,
    pendingSource,
    disabled,
    upload,
    sendMessage,
    conversationId,
    onBlur,
    onMessageSent,
    editMessageId,
    editMessageAsync,
    onEditSaved,
    replyTo,
    replyPreview,
    onCancelReply,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = (text.trim().length > 0 || pendingFile !== null) && !disabled && !isEditingMessage;

  return (
      <div className="overflow-hidden border-t border-border/50 p-2 sm:p-3 bg-background">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Replying
            </p>
            <p className="truncate text-sm text-foreground">
              {resolveReplyPreviewContent(replyTo)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCancelReply?.()}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      )}
      {editMessageId && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>Editing message</span>
          <button
            type="button"
            onClick={() => {
              setText(prevDraftRef.current);
              onCancelEdit?.();
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      )}

      {/* File preview */}
      {pendingFile && (
        <div className="mb-2 px-1">
          <FilePreview
            file={pendingFile}
            onRemove={() => {
              setPendingFile(null);
              setPendingSource("file");
              cancel();
            }}
            progress={isUploading ? progress : undefined}
          />
        </div>
      )}

      {stealthEnabled && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Stealth duration</span>
          <Select
            value={stealthDuration}
            onValueChange={(value) => setStealthDuration(value as StealthDuration)}
          >
            <SelectTrigger className="h-8 w-[7.5rem] max-w-full">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {STEALTH_DURATIONS.map((duration) => (
                <SelectItem key={duration} value={duration}>
                  {duration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex min-w-0 items-end gap-1.5 sm:gap-2">
        {/* Stealth toggle */}
        <button
          type="button"
          disabled={disabled || isUploading || !!editMessageId || stealthEnabled}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 mb-0.5"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          type="button"
          disabled={disabled || !!editMessageId || pendingFile !== null}
          onClick={() => {
            if (stealthEnabled) {
              setStealthEnabled(false);
              return;
            }
            setPendingFile(null);
            setPendingSource("file");
            cancel();
            setStealthEnabled(true);
          }}
          className={cn(
            "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors mb-0.5",
            stealthEnabled
              ? "bg-amber-100/60 text-amber-700/80 dark:bg-amber-400/10 dark:text-amber-200/80"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            (disabled || !!editMessageId || pendingFile !== null) && "opacity-50"
          )}
          aria-pressed={stealthEnabled}
          aria-label="Toggle stealth mode"
        >
          {stealthEnabled ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => handleFileChange(event, "file")}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => {
            setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
            onInputChange();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "flex-1 min-w-0 resize-none rounded-xl bg-muted/50 border-0 px-2.5 sm:px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all max-h-30 leading-relaxed",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Send */}
        <button
          type="button"
          disabled={!canSend || isUploading}
          onClick={handleSend}
          className={cn(
            "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all mb-0.5",
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
