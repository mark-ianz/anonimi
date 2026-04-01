"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { Ban } from "@/types/admin";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  lifted: "Lifted",
};

function BanRow({ ban, onUnban, canUnban }: { ban: Ban; onUnban: (id: string) => void; canUnban: boolean }) {
  const isPermanent = !ban.expiresAt;
  const isExpired = !ban.active;

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">
          {ban.username?.[0]?.toUpperCase() ?? "?"}
        </span>
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{ban.username}</p>
          <span className="text-[10px] text-muted-foreground">@{ban.anonimiId}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{ban.reason}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>By {ban.bannedByUsername}</span>
          <span>·</span>
          <span>{new Date(ban.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>{isPermanent ? "Permanent" : `Expires ${new Date(ban.expiresAt!).toLocaleDateString()}`}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
          ban.active ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          {ban.active ? "Active" : "Inactive"}
        </span>
        {ban.active && canUnban && (
          <button
            onClick={() => onUnban(ban.id)}
            className="h-7 px-2.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors"
          >
            Unban
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminBansPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === "super_admin";
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bans", showHistory],
    queryFn: async () => {
      const endpoint = showHistory ? "/admin/bans/history" : "/admin/bans";
      const res = await api.get(endpoint);
      return res.data.data as Ban[];
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (banId: string) => {
      // Unban via user endpoint
      const ban = data?.find((b) => b.id === banId);
      if (!ban) throw new Error("Ban not found");
      await api.post(`/admin/users/${ban.userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bans"] });
      toast.success("User unbanned");
    },
    onError: () => toast.error("Failed to unban user"),
  });

  const bans = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-semibold">Bans</h1>
            {isSuperAdmin && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                  showHistory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {showHistory ? "Active Only" : "Full History"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : bans.length === 0 ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">No bans found</p>
            </div>
          ) : (
            bans.map((ban) => (
              <BanRow
                key={ban.id}
                ban={ban}
                onUnban={(id) => unbanMutation.mutate(id)}
                canUnban={true}
              />
            ))
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
