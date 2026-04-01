"use client";

import { useState } from "react";
import { Shield, UserX, MoreHorizontal } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { API_BASE } from "@/lib/constants";

interface BlockEntry {
  blockId: string;
  blockedUser: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
}

function BlockedUserRow({ entry, onUnblock }: { entry: BlockEntry; onUnblock: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="relative shrink-0">
        {entry.blockedUser.profileImage ? (
          <img
            src={`${API_BASE.replace("/api", "")}${entry.blockedUser.profileImage}`}
            alt={entry.blockedUser.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground">
              {entry.blockedUser.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive/80 border-2 border-background flex items-center justify-center">
          <UserX className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.blockedUser.username}</p>
        <p className="text-xs text-muted-foreground truncate">@{entry.blockedUser.anonimiId}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 z-20 w-36 bg-popover border border-border/40 rounded-xl shadow-elevated overflow-hidden">
              <button
                onClick={() => {
                  setOpen(false);
                  onUnblock(entry.blockId);
                }}
                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                Unblock
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BlockedPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const res = await api.get("/blocks");
      return res.data.data as BlockEntry[];
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await api.delete(`/blocks/${blockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      toast.success("User unblocked");
    },
    onError: () => {
      toast.error("Failed to unblock user");
    },
  });

  const blocks = data ?? [];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0">
          <h1 className="text-xl font-display font-semibold">Blocked Users</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Blocked users cannot message you or see your status.
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm mb-1">No blocked users</p>
              <p className="text-xs text-muted-foreground">
                Users you block will appear here.
              </p>
            </div>
          ) : (
            <div>
              <p className="px-4 py-2.5 text-xs text-muted-foreground">
                {blocks.length} blocked {blocks.length === 1 ? "user" : "users"}
              </p>
              {blocks.map((entry) => (
                <BlockedUserRow
                  key={entry.blockId}
                  entry={entry}
                  onUnblock={(id) => unblockMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
