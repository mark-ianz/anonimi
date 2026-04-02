"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { API_BASE } from "@/lib/constants";
import GroupAvatar from "@/components/shared/GroupAvatar";
import Link from "next/link";

interface GroupMember {
  userId: string;
  anonimiId: string;
  username: string;
  profileImage: string | null;
  role: string;
  joinedAt: string;
}

interface AdminGroupDetail {
  id: string;
  conversationId: string;
  name: string;
  image: string | null;
  ownerId: string;
  memberCount: number;
  settings: { joinRequestEnabled: boolean };
  myRole: string;
  createdAt: string;
  members?: GroupMember[];
}

export default function AdminGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["admin-group", groupId],
    queryFn: async () => {
      const res = await api.get(`/admin/groups/${groupId}`);
      return res.data.data as AdminGroupDetail;
    },
    enabled: !!groupId,
  });

  const members = group?.members ?? [];

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success("Group archived");
      router.replace("/admin/groups");
    },
    onError: () => toast.error("Failed to archive group"),
  });

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-semibold">Group Detail</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groupLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !group ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">Group not found</p>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
              {/* Group info */}
              <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <GroupAvatar
                    imageUrl={group.image ? `${API_BASE.replace("/api", "")}${group.image}` : null}
                    fallbackProfileImages={members.map((m) => m.profileImage)}
                    name={group.name}
                    alt={group.name}
                    className="w-12 h-12"
                    roundedClassName="rounded-xl"
                    textClassName="text-base"
                  />
                  <div>
                    <p className="font-bold text-base">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.memberCount} members · Created {new Date(group.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Join Requests</p>
                    <p className="font-medium">{group.settings.joinRequestEnabled ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversation ID</p>
                    <p className="font-medium font-mono text-[10px]">{group.conversationId}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/admin/messages?conversationId=${group.conversationId}`}
                  className="flex-1 flex items-center justify-center h-9 rounded-xl border border-border/40 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  View Messages
                </Link>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Archive group "${group.name}"? This cannot be undone.`)) {
                        archiveMutation.mutate();
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}
              </div>

              {/* Members */}
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Members ({members.length})
                </h2>
                <div className="border border-border/30 rounded-2xl overflow-hidden">
                  {members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/20 last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {m.profileImage ? (
                          <img src={`${API_BASE.replace("/api", "")}${m.profileImage}`} className="w-full h-full rounded-full object-cover" alt={m.username} />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">{m.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.username}</p>
                        <p className="text-[10px] text-muted-foreground">@{m.anonimiId}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground capitalize px-1.5 py-0.5 bg-muted/60 rounded-md">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
