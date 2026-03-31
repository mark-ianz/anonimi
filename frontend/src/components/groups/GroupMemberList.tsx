"use client";

import { useState } from "react";
import { useGroup } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GroupMemberItem from "./GroupMemberItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Group, GroupMember } from "@/types/group";
import { Search, UserPlus } from "lucide-react";
import api from "@/lib/api";

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
        m.echoId.toLowerCase().includes(search.toLowerCase())
      )
    : displayMembers;

  const canManage = group.myRole === "owner" || group.myRole === "admin";

  const handleAddMembers = (echoIds: string[]) => {
    addMembers(echoIds);
    setShowAddModal(false);
  };

  const handleSendMessage = async (echoId: string) => {
    try {
      const res = await api.post("/conversations", { participantEchoId: echoId });
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

  const handleBlock = async (echoId: string) => {
    try {
      await api.post("/blocks", { targetEchoId: echoId });
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

      {canManage && (
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
            onMute={(userId) => muteMember({ userId, durationMinutes: 60 })}
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
          existingMemberEchoIds={displayMembers.map((m) => m.echoId)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMembers}
        />
      )}
    </div>
  );
}

function AddMembersModal({
  existingMemberEchoIds,
  onClose,
  onAdd,
}: {
  existingMemberEchoIds: string[];
  onClose: () => void;
  onAdd: (echoIds: string[]) => void;
}) {
  const { contacts, isLoadingContacts } = useContacts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const existing = new Set(existingMemberEchoIds);
  const selectableContacts = contacts.filter((contact) => !existing.has(contact.echoId));
  const filtered = search
    ? selectableContacts.filter((c) => {
        const display = (c.nickname ?? c.username).toLowerCase();
        const q = search.toLowerCase();
        return display.includes(q) || c.echoId.toLowerCase().includes(q);
      })
    : selectableContacts;

  const toggle = (echoId: string) => {
    setSelected((prev) =>
      prev.includes(echoId) ? prev.filter((id) => id !== echoId) : [...prev, echoId]
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
          placeholder="Search by username or EchoID..."
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
          autoFocus
        />

        <div className="max-h-72 overflow-y-auto space-y-1">
          {isLoadingContacts && (
            <LoadingSkeleton rows={4} className="px-1 py-2" />
          )}

          {!isLoadingContacts && filtered.map((contact) => {
            const isSelected = selected.includes(contact.echoId);
            return (
              <button
                key={contact.contactId}
                onClick={() => toggle(contact.echoId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                  {contact.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={contact.profileImage} alt={contact.username} className="w-full h-full object-cover" />
                  ) : (
                    contact.username[0]?.toUpperCase() ?? "U"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{contact.nickname ?? contact.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{contact.echoId}</p>
                </div>
                {isSelected && <span className="text-xs text-primary font-medium">Selected</span>}
              </button>
            );
          })}

          {!isLoadingContacts && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No contacts available to add.</p>
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
