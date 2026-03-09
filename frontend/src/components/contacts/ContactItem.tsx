"use client";

import { useState } from "react";
import { MoreVertical, MessageCircle, UserMinus, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import api from "@/lib/api";
import type { Contact } from "@/types/contact";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface ContactItemProps {
  contact: Contact;
  onRemove: (contactId: string) => void;
  onSetNickname: (contactId: string, nickname: string) => void;
}

export default function ContactItem({ contact, onRemove, onSetNickname }: ContactItemProps) {
  const router = useRouter();
  const { status: presenceStatus } = usePresence(contact.echoId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(contact.nickname ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const displayName = contact.nickname ?? contact.username;

  const openConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/conversations", { participantEchoId: contact.echoId });
      return res.data.data as { conversationId: string };
    },
    onSuccess: (data) => {
      router.push(`/chat/${data.conversationId}`);
    },
    onError: () => toast.error("Failed to open conversation."),
  });

  function handleNicknameSave() {
    onSetNickname(contact.contactId, nicknameInput.trim());
    setEditingNickname(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group border-b border-border/20">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {contact.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contact.profileImage} alt={contact.username} className="w-full h-full object-cover" />
            ) : (
              contact.username[0].toUpperCase()
            )}
          </div>
          <span
            className={cn(
              "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
              presenceStatus === "online" ? "bg-green-500" : "bg-muted-foreground/40"
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editingNickname ? (
            <div className="flex items-center gap-1">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNicknameSave();
                  if (e.key === "Escape") setEditingNickname(false);
                }}
                autoFocus
                className="flex-1 h-7 px-2 rounded-lg text-sm bg-muted/60 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="Set nickname..."
              />
              <button onClick={handleNicknameSave} className="w-6 h-6 rounded flex items-center justify-center text-green-500 hover:bg-green-500/10">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingNickname(false)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium truncate">{displayName}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">@{contact.echoId}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => openConversationMutation.mutate()}
            disabled={openConversationMutation.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-40 animate-fade-in">
                <button
                  onClick={() => { setEditingNickname(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {contact.nickname ? "Edit nickname" : "Set nickname"}
                </button>
                <button
                  onClick={() => { setConfirmRemove(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Remove contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
