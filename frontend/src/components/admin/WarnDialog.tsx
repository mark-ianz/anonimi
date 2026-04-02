"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import type { AdminWarning } from "@/types/admin";

interface WarnDialogProps {
  userId: string;
  username: string;
  open: boolean;
  onClose: () => void;
}

export default function WarnDialog({ userId, username, open, onClose }: WarnDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");

  const warnMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${userId}/warn`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.setQueryData<AdminWarning[]>(["admin-warnings"], (prev) => {
        if (!prev) return prev;
        const newWarning: AdminWarning = {
          id: `local-${Date.now()}`,
          userId,
          username,
          anonimiId: null,
          profileImage: null,
          adminId: user?.id ?? null,
          adminUsername: user?.username ?? null,
          message: message.trim(),
          createdAt: new Date().toISOString(),
        };
        return [newWarning, ...prev];
      });
      toast.success(`Warning sent to @${username}`);
      onClose();
      setMessage("");
    },
    onError: () => toast.error("Failed to send warning"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background border border-border/40 rounded-2xl shadow-elevated p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold font-display">Warn User</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send a warning notification to <span className="text-foreground font-medium">@{username}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Warning Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain the reason for this warning..."
            rows={4}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => warnMutation.mutate()}
            disabled={!message.trim() || warnMutation.isPending}
            className="flex-1 h-10 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-orange-500/90 transition-colors"
          >
            {warnMutation.isPending ? "Sending..." : "Send Warning"}
          </button>
        </div>
      </div>
    </div>
  );
}
