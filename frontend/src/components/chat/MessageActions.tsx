"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, RotateCcw, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { Message } from "@/types/message";

interface MessageActionsProps {
  message: Message;
  isMine: boolean;
}

export default function MessageActions({ message, isMine }: MessageActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirmUnsend, setConfirmUnsend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { deleteForMe, unsend } = useMessages(message.conversationId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <div
            className={cn(
              "absolute z-10 bottom-full mb-1 glass rounded-xl shadow-elevated py-1 min-w-[140px] animate-fade-in",
              isMine ? "right-0" : "left-0"
            )}
          >
            <button
              onClick={() => {
                setOpen(false);
                setConfirmDelete(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete for me
            </button>
            {isMine && !message.unsent && (
              <button
                onClick={() => {
                  setOpen(false);
                  setConfirmUnsend(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Unsend
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteForMe(message.id);
          setConfirmDelete(false);
        }}
        title="Delete message?"
        description="This will remove the message from your view only."
        confirmLabel="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmUnsend}
        onClose={() => setConfirmUnsend(false)}
        onConfirm={() => {
          unsend(message.id);
          setConfirmUnsend(false);
        }}
        title="Unsend message?"
        description="The message will be removed for everyone."
        confirmLabel="Unsend"
        variant="destructive"
      />
    </>
  );
}
