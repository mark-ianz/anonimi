"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Plus, Search } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import TemporaryAccountModal from "@/components/shared/TemporaryAccountModal";
import UserAvatar from "@/components/shared/UserAvatar";
import type { SearchUser } from "@/types/user";

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
  const router = useRouter();
  const { createGroup, isCreating } = useGroups();
  const { contacts } = useContacts();
  const { user } = useAuthStore();
  const isTempUser = !!user?.isTemporary;
  const [tempGateOpen, setTempGateOpen] = useState(false);

  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const usersQuery = useQuery({
    queryKey: ["groups", "create-dialog", "users-search", debouncedSearchQuery],
    queryFn: async () => {
      const res = await api.get("/users/search", {
        params: { q: debouncedSearchQuery.trim(), limit: 20 },
      });
      return (res.data?.data ?? []) as SearchUser[];
    },
    enabled: debouncedSearchQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => {
    const n = c.nickname ?? c.username;
    return (
      n.toLowerCase().includes(normalizedQuery) ||
      c.anonimiId.toLowerCase().includes(normalizedQuery)
    );
  });
  const displayedUsers =
    debouncedSearchQuery.trim().length >= 2
      ? (usersQuery.data ?? []).filter((candidate) => candidate.id !== user?.id)
      : filteredContacts.map((contact) => ({
          id: contact.contactId,
          anonimiId: contact.anonimiId,
          username: contact.nickname ?? contact.username,
          profileImage: contact.profileImage,
          onlineStatus: contact.onlineStatus,
          isTemporary: false,
        }));

  function toggleContact(anonimiId: string) {
    setSelectedIds((prev) =>
      prev.includes(anonimiId) ? prev.filter((id) => id !== anonimiId) : [...prev, anonimiId]
    );
  }

  function handleCreate() {
    if (isTempUser) {
      setTempGateOpen(true);
      return;
    }
    const trimmedName = name.trim();
    createGroup(
      {
        ...(trimmedName ? { name: trimmedName } : {}),
        memberAnonimiIds: selectedIds,
      },
      {
        onSuccess: (createdGroup) => {
          onClose();
          if (createdGroup?.conversationId) {
            router.push(`/chat/${createdGroup.conversationId}`);
            return;
          }
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
              {selectedIds.map((anonimiId) => {
                const c = contacts.find((c) => c.anonimiId === anonimiId);
                const foundUser = (usersQuery.data ?? []).find((candidate) => candidate.anonimiId === anonimiId);
                return (
                  <span key={anonimiId} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {c?.nickname ?? c?.username ?? foundUser?.username ?? anonimiId}
                    <button onClick={() => toggleContact(anonimiId)} className="hover:text-destructive transition-colors">
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
                placeholder="Search any user..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto">
              {displayedUsers.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.anonimiId);
                return (
                  <button
                    key={candidate.id}
                    onClick={() => toggleContact(candidate.anonimiId)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <UserAvatar
                      imageUrl={candidate.profileImage}
                      name={candidate.username}
                      className="w-8 h-8 rounded-lg shrink-0"
                      roundedClassName="rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{candidate.username}</p>
                      <p className="text-xs text-muted-foreground">@{candidate.anonimiId}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Plus className="w-3 h-3 text-white rotate-45" />
                      </div>
                    )}
                  </button>
                );
              })}
              {usersQuery.isFetching && (
                <p className="text-sm text-muted-foreground text-center py-4">Searching users...</p>
              )}
              {!usersQuery.isFetching && !displayedUsers.length && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : null}
            Create Group {selectedIds.length > 0 ? `(${selectedIds.length} members)` : "(just you)"}
          </button>
        </div>
      </div>

      <TemporaryAccountModal
        open={tempGateOpen}
        onClose={() => setTempGateOpen(false)}
      />
    </div>
  );
}
