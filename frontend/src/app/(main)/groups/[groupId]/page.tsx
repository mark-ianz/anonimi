"use client";

import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGroup } from "@/hooks/useGroups";
import GroupMemberList from "@/components/groups/GroupMemberList";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { group, isLoadingGroup } = useGroup(groupId);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            {isLoadingGroup ? (
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <h1 className="font-display font-semibold truncate">{group?.name}</h1>
            )}
          </div>
          {group && (group.myRole === "owner" || group.myRole === "admin") && (
            <Link href={`/groups/${groupId}/settings`} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingGroup ? (
            <LoadingSkeleton rows={5} variant="conversation" />
          ) : group ? (
            <GroupMemberList groupId={groupId} currentUserRole={group.myRole} />
          ) : (
            <p className="text-center text-muted-foreground py-12">Group not found.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
