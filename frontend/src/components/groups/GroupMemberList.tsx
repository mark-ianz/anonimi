"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGroup } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GroupMemberItem from "./GroupMemberItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Group, GroupMember } from "@/types/group";
import type { SearchUser } from "@/types/user";
import { Search, UserPlus } from "lucide-react";
import api from "@/lib/api";
import UserAvatar from "@/components/shared/UserAvatar";

interface GroupMemberListProps {
  groupId: string;
  members: GroupMember[];
  group: Group;
}

export default function GroupMemberList({ groupId, members: initialMembers, group }: GroupMemberListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { members, isLoadingMembers, removeMember, changeRole, addMembers, muteMember, unmuteMember, transferOwnership, setMemberNickname } = useGroup(groupId);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const displayMembers = members.length > 0 ? members : initialMembers;
  const filtered = search
    ? displayMembers.filter(m => 
        m.username.toLowerCase().includes(search.toLowerCase()) ||
        m.anonimiId.toLowerCase().includes(search.toLowerCase())
      )
    : displayMembers;

  const canAddMembers = !!group.myRole;

  const handleAddMembers = (anonimiIds: string[]) => {
    addMembers(anonimiIds);
    setShowAddModal(false);
  };

  const handleSendMessage = async (anonimiId: string) => {
    try {
      const res = await api.post("/conversations", { participantAnonimiId: anonimiId });
      const conversationId = res.data?.data?.conversationId as string | undefined;
      if (!conversationId) {
        toast.error("Could not open conversation.");
        return;
      }
      router.push(`/chat/${conversationId}`);
    } catch {
      toast.error("Failed to open conversation.");
    }
  };

  const handleBlock = async (anonimiId: string) => {
    try {
      await api.post("/blocks", { targetAnonimiId: anonimiId });
      toast.success("User blocked.");
    } catch {
      toast.error("Failed to block user.");
    }
  };

  if (isLoadingMembers) {
    return <LoadingSkeleton rows={5} className="px-4 py-2" />;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground"
        />
      </div>

      {canAddMembers && (
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 w-full justify-center h-10 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Members
        </button>
      )}

      <div className="space-y-1">
        {filtered.map((member) => (
          <GroupMemberItem
            key={member.userId}
            member={member}
            currentUserRole={group.myRole}
            currentUserId={user?.id ?? ""}
            onRemove={(userId) => removeMember(userId)}
            onChangeRole={(userId, role) => changeRole({ userId, role })}
            onMute={(userId, durationMinutes, reason) => muteMember({ userId, durationMinutes, reason })}
            onUnmute={(userId) => unmuteMember(userId)}
            onTransferOwnership={(userId) => transferOwnership(userId)}
            onSendMessage={handleSendMessage}
            onSetNickname={(userId, nickname) => setMemberNickname({ userId, nickname })}
            onBlock={handleBlock}
          />
        ))}
      </div>

      {showAddModal && (
        <AddMembersModal
          existingMemberAnonimiIds={displayMembers.map((m) => m.anonimiId)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMembers}
        />
      )}
    </div>
  );
}

function AddMembersModal({
  existingMemberAnonimiIds,
  onClose,
  onAdd,
}: {
  existingMemberAnonimiIds: string[];
  onClose: () => void;
  onAdd: (anonimiIds: string[]) => void;
}) {
  const { user } = useAuthStore();
  const { contacts, isLoadingContacts } = useContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const debouncedSearch = useDebounce(search, 350);

  const existing = new Set(existingMemberAnonimiIds);
  const usersQuery = useQuery({
    queryKey: ["groups", "add-members", "users-search", debouncedSearch],
    queryFn: async () => {
      const res = await api.get("/users/search", {
        params: { q: debouncedSearch.trim(), limit: 20 },
      });
      return (res.data?.data ?? []) as SearchUser[];
    },
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  const selectableContacts = contacts.filter((contact) => !existing.has(contact.anonimiId));
  const fallbackUsers = selectableContacts.map((contact) => ({
    id: contact.contactId,
    anonimiId: contact.anonimiId,
    username: contact.nickname ?? contact.username,
    profileImage: contact.profileImage,
    onlineStatus: contact.onlineStatus,
    isTemporary: false,
  }));
  const filtered = debouncedSearch.trim().length >= 2
    ? (usersQuery.data ?? []).filter(
        (candidate) => !existing.has(candidate.anonimiId) && candidate.id !== user?.id
      )
    : fallbackUsers.filter((candidate) => {
        const display = candidate.username.toLowerCase();
        const q = search.toLowerCase();
        return display.includes(q) || candidate.anonimiId.toLowerCase().includes(q);
      });

  const toggle = (anonimiId: string) => {
    setSelected((prev) =>
      prev.includes(anonimiId) ? prev.filter((id) => id !== anonimiId) : [...prev, anonimiId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md shadow-elevated p-4 space-y-4">
        <h3 className="font-display font-semibold">Add Members</h3>
        
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any user by username or anonimi..."
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
          autoFocus
        />

        <div className="max-h-72 overflow-y-auto space-y-1">
          {isLoadingContacts && (
            <LoadingSkeleton rows={4} className="px-1 py-2" />
          )}

          {!isLoadingContacts && filtered.map((candidate) => {
            const isSelected = selected.includes(candidate.anonimiId);
            return (
              <button
                key={candidate.id}
                onClick={() => toggle(candidate.anonimiId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <UserAvatar
                  imageUrl={candidate.profileImage}
                  name={candidate.username}
                  className="w-9 h-9"
                  roundedClassName="rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{candidate.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{candidate.anonimiId}</p>
                </div>
                {isSelected && <span className="text-xs text-primary font-medium">Selected</span>}
              </button>
            );
          })}

          {usersQuery.isFetching && (
            <p className="text-sm text-muted-foreground text-center py-6">Searching users...</p>
          )}

          {!isLoadingContacts && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No users available to add.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(selected)}
            disabled={selected.length === 0}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Add {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
