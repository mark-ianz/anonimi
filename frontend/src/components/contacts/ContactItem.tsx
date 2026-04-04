"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import api from "@/lib/api";
import type { Contact } from "@/types/contact";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import UserAvatar from "@/components/shared/UserAvatar";

interface ContactItemProps {
  contact: Contact;
  onRemove: (contactId: string) => void;
}

export default function ContactItem({ contact, onRemove }: ContactItemProps) {
  const router = useRouter();
  const { status: presenceStatus } = usePresence(
    contact.contactId,
    contact.onlineStatus,
    contact.lastSeen
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = contact.nickname ?? contact.username;

  const openConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/conversations", { participantAnonimiId: contact.anonimiId });
      return res.data.data as { conversationId: string };
    },
    onSuccess: (data) => {
      router.push(`/chat/${data.conversationId}`);
    },
    onError: () => toast.error("Failed to open conversation."),
  });

  useEffect(() => {
    if (!menuOpen) return;

    const updateMenuPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 160;
      const viewportWidth = window.innerWidth;
      const left = Math.max(8, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8));
      setMenuPosition({ top: rect.bottom + 6, left });
    };

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuOpen]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => openConversationMutation.mutate()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openConversationMutation.mutate();
          }
        }}
        className="group flex cursor-pointer items-center gap-3 border-b border-border/20 px-4 py-3 transition-colors hover:bg-muted/40"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <UserAvatar
            imageUrl={contact.profileImage}
            name={contact.username}
            className="w-11 h-11"
            roundedClassName="rounded-xl"
          />
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
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">@{contact.anonimiId}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            ref={triggerRef}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Contact actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {menuOpen && menuPosition && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-120 min-w-40 animate-fade-in overflow-hidden rounded-xl border border-border/70 bg-card/95 p-1 shadow-elevated backdrop-blur-sm"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmRemove(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <UserMinus className="w-4 h-4" />
              Remove contact
            </button>
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => { onRemove(contact.contactId); setConfirmRemove(false); }}
        title="Remove contact?"
        description={`Remove ${displayName} from your contacts?`}
        confirmLabel="Remove"
        variant="destructive"
      />
    </>
  );
}
