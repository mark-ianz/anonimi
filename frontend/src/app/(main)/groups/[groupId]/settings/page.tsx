"use client";

import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGroup } from "@/hooks/useGroups";
import GroupSettings from "@/components/groups/GroupSettings";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { ArrowLeft } from "lucide-react";

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const { group, isLoadingGroup } = useGroup(groupId);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-semibold">Group Settings</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingGroup ? (
            <LoadingSkeleton rows={4} className="p-6" />
          ) : group ? (
            <GroupSettings group={group} />
          ) : (
            <p className="text-center text-muted-foreground py-12">Group not found.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
