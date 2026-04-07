"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Ban as BanIcon, ShieldOff } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import BanDialog from "@/components/admin/BanDialog";
import WarnDialog from "@/components/admin/WarnDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import UserAvatar from "@/components/shared/UserAvatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { AdminUser } from "@/types/admin";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  banned: "bg-destructive/15 text-destructive",
  pending_verification: "bg-orange-500/15 text-orange-500",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const [showBan, setShowBan] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRequestConfirm, setShowRequestConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data.data as AdminUser;
    },
    enabled: !!userId,
  });

  const unbanMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      toast.success("User unbanned");
    },
    onError: () => toast.error("Failed to unban user"),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${userId}/delete-request`, { reason: deleteReason.trim() });
    },
    onSuccess: () => {
      toast.success("Delete request sent to Super Admin");
      setShowRequestConfirm(false);
      setDeleteReason("");
    },
    onError: () => toast.error("Failed to request delete"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast.success("User deleted");
      router.replace("/admin/users");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const profile = data;
  const isSuperAdmin = me?.role === "super_admin";
  const isModerator = me?.role === "moderator";
  const canModerate = isSuperAdmin || isModerator;

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-semibold">User Profile</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !profile ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">User not found</p>
            </div>
          ) : (
            <div className="p-6 space-y-5 max-w-2xl mx-auto w-full">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <UserAvatar
                  imageUrl={profile.profileImage}
                  name={profile.username}
                  alt={profile.username}
                  className="w-16 h-16"
                  textClassName="text-xl"
                />
                <div>
                  <p className="text-lg font-bold font-display">{profile.username}</p>
                  <p className="text-sm text-muted-foreground">@{profile.anonimiId}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColors[profile.status] ?? "bg-muted text-muted-foreground")}>
                      {profile.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {profile.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Email", value: profile.email },
                  { label: "Phone", value: profile.phone ?? "—" },
                  { label: "Last Seen", value: profile.lastSeen ? new Date(profile.lastSeen).toLocaleString() : "—" },
                  { label: "Joined", value: new Date(profile.createdAt).toLocaleDateString() },
                  { label: "Email Verified", value: profile.emailVerified ? "Yes" : "No" },
                  { label: "Online Status", value: profile.onlineStatus },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {canModerate ? (
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Moderation Actions
                  </h2>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowWarn(true)}
                      className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Send Warning
                    </button>

                    {profile.status !== "banned" ? (
                      <button
                        onClick={() => setShowBan(true)}
                        className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                      >
                        <BanIcon className="w-4 h-4" />
                        Ban User
                      </button>
                    ) : (
                      <button
                        onClick={() => unbanMutation.mutate()}
                        disabled={unbanMutation.isPending}
                        className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                      >
                        <ShieldOff className="w-4 h-4" />
                        {unbanMutation.isPending ? "Unbanning..." : "Unban User"}
                      </button>
                    )}

                    {isModerator && !isSuperAdmin && profile.role !== "super_admin" && (
                      <button
                        onClick={() => setShowRequestConfirm(true)}
                        className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                      >
                        Request Delete User
                      </button>
                    )}

                    {isSuperAdmin && profile.role !== "super_admin" && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                      >
                        Delete User
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Support staff have view-only access for user profiles.
                </div>
              )}

              {canModerate && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200">
                  Conversation contents are not available in admin tools. Moderation can act on accounts and reports without decrypting private messages.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {profile && (
        <>
          <BanDialog
            userId={userId}
            username={profile.username}
            open={showBan}
            onClose={() => setShowBan(false)}
          />
          <WarnDialog
            userId={userId}
            username={profile.username}
            open={showWarn}
            onClose={() => setShowWarn(false)}
          />
          <ConfirmDialog
            open={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={() => deleteUserMutation.mutate()}
            title={`Delete @${profile.username}?`}
            description="This action is permanent and cannot be undone."
            confirmLabel="Delete User"
            variant="destructive"
            loading={deleteUserMutation.isPending}
          />
          {showRequestConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowRequestConfirm(false)}
              />
              <div className="relative z-10 w-full max-w-md bg-background border border-border/40 rounded-2xl shadow-elevated p-5 space-y-4">
                <div>
                  <h2 className="text-base font-semibold font-display">Request Deletion</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Send a delete request for <span className="text-foreground font-medium">@{profile.username}</span>.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Reason / Note
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Explain why this user should be deleted..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRequestConfirm(false)}
                    className="flex-1 h-10 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteRequestMutation.mutate()}
                    disabled={!deleteReason.trim() || deleteRequestMutation.isPending}
                    className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50 hover:bg-destructive/90 transition-colors"
                  >
                    {deleteRequestMutation.isPending ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminRoute>
  );
}
