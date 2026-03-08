"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BanDialogProps {
  userId: string;
  username: string;
  open: boolean;
  onClose: () => void;
}

const durationOptions = [
  { value: "1d", label: "1 Day" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "permanent", label: "Permanent" },
];

export default function BanDialog({ userId, username, open, onClose }: BanDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7d");

  const banMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/users/${userId}/ban`, { reason, duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-bans"] });
      toast.success(`${username} has been banned`);
      onClose();
      setReason("");
      setDuration("7d");
    },
    onError: () => toast.error("Failed to ban user"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background border border-border/40 rounded-2xl shadow-elevated p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold font-display">Ban User</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            You are about to ban <span className="text-foreground font-medium">@{username}</span>
          </p>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={cn(
                  "h-9 rounded-xl border text-xs font-medium transition-colors",
                  duration === opt.value
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border/40 text-muted-foreground hover:bg-muted/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the ban..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => banMutation.mutate()}
            disabled={!reason.trim() || banMutation.isPending}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50 hover:bg-destructive/90 transition-colors"
          >
            {banMutation.isPending ? "Banning..." : "Confirm Ban"}
          </button>
        </div>
      </div>
    </div>
  );
}
