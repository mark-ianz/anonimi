"use client";

import { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
  const router = useRouter();
  const { createGroup, isCreating } = useGroups();
  const { contacts } = useContacts();

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = contacts.filter((c) => {
    const n = c.nickname ?? c.username;
    return n.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.echoId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function toggleContact(echoId: string) {
    setSelectedIds((prev) =>
      prev.includes(echoId) ? prev.filter((id) => id !== echoId) : [...prev, echoId]
    );
  }

  function handleCreate() {
    if (selectedIds.length === 0) return;
    const trimmedName = name.trim();
    createGroup(
      {
        ...(trimmedName ? { name: trimmedName } : {}),
        memberEchoIds: selectedIds,
      },
      {
        onSuccess: () => {
          onClose();
          router.push("/chat");
        },
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md shadow-elevated animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h3 className="font-display font-semibold">New Group</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Group name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave empty to auto-generate the group name.
            </p>
          </div>

          {/* Selected preview */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((echoId) => {
                const c = contacts.find((c) => c.echoId === echoId);
                return (
                  <span key={echoId} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {c?.nickname ?? c?.username ?? echoId}
                    <button onClick={() => toggleContact(echoId)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Contact search */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Add members</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto">
              {filtered.map((contact) => {
                const isSelected = selectedIds.includes(contact.echoId);
                return (
                  <button
                    key={contact.contactId}
                    onClick={() => toggleContact(contact.echoId)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {contact.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={contact.profileImage} alt={contact.username} className="w-full h-full object-cover" />
                      ) : (
                        contact.username[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.nickname ?? contact.username}</p>
                      <p className="text-xs text-muted-foreground">@{contact.echoId}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Plus className="w-3 h-3 text-white rotate-45" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!filtered.length && (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts found</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <button
            onClick={handleCreate}
            disabled={selectedIds.length === 0 || isCreating}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : null}
            Create Group ({selectedIds.length} members)
          </button>
        </div>
      </div>
    </div>
  );
}
