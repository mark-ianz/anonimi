"use client";

import { useGroup } from "@/hooks/useGroups";
import { useAuthStore } from "@/stores/authStore";
import GroupMemberItem from "./GroupMemberItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { GroupRole } from "@/types/group";

interface GroupMemberListProps {
  groupId: string;
  currentUserRole: GroupRole;
}

export default function GroupMemberList({ groupId, currentUserRole }: GroupMemberListProps) {
  const { user } = useAuthStore();
  const { members, isLoadingMembers, removeMember, changeRole } = useGroup(groupId);

  if (isLoadingMembers) {
    return <LoadingSkeleton rows={5} className="px-4 py-2" />;
  }

  return (
    <div className="overflow-y-auto">
      {members.map((member) => (
        <GroupMemberItem
          key={member.userId}
          member={member}
          currentUserRole={currentUserRole}
          currentUserId={user?.id ?? ""}
          onRemove={removeMember}
          onChangeRole={(userId, role) => changeRole({ userId, role })}
        />
      ))}
    </div>
  );
}
