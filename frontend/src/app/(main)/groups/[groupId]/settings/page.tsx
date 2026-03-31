"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGroup } from "@/hooks/useGroups";
import GroupSettings from "@/components/groups/GroupSettings";
import GroupMemberList from "@/components/groups/GroupMemberList";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

type Tab = "settings" | "members";

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const { group, isLoadingGroup, members } = useGroup(groupId);
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "members" ? "members" : "settings"
  );

  useEffect(() => {
    const targetTab = searchParams.get("tab") === "members" ? "members" : "settings";
    setTab(targetTab);
  }, [searchParams]);

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    router.replace(`/groups/${groupId}/settings?tab=${nextTab}`);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display font-semibold flex-1 min-w-0 truncate">{group?.name ?? "Group"}</h1>
          {group && tab !== "members" && (
            <button
              onClick={() => switchTab("members")}
              className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>

        <div className="flex border-b border-border/30">
          <button
            onClick={() => switchTab("settings")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "settings" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Settings
          </button>
          <button
            onClick={() => switchTab("members")}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === "members" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="w-4 h-4" />
            Members
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingGroup ? (
            <LoadingSkeleton rows={4} className="p-6" />
          ) : group ? (
            tab === "settings" ? (
              <GroupSettings group={group} />
            ) : (
              <GroupMemberList groupId={groupId} members={members} group={group} />
            )
          ) : (
            <p className="text-center text-muted-foreground py-12">Group not found.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
