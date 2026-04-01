"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/user";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function UserProfileEditor() {
  const { user, updateProfile, isUpdatingProfile } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const canEditUsername = user?.usernameCanEdit ?? false;

  const trimmedUsername = username.trim();
  const trimmedPhone = phone.trim();
  const hasChanges =
    (trimmedUsername && trimmedUsername !== (user?.username ?? "")) ||
    trimmedPhone !== (user?.phone ?? "");

  function handleSave() {
    const patch: Partial<Pick<AuthUser, "username" | "phone">> = {};
    const nextUsername = trimmedUsername;

    if (nextUsername && nextUsername !== user?.username) {
      if (nextUsername.length < 3 || nextUsername.length > 30) {
        toast.error("Username must be between 3 and 30 characters.");
        return;
      }

      if (!/^[a-zA-Z0-9_.]+$/.test(nextUsername)) {
        toast.error("Username can only contain letters, numbers, underscores, and periods.");
        return;
      }

      patch.username = nextUsername;
    }

    if (trimmedPhone !== (user?.phone ?? "")) patch.phone = trimmedPhone || undefined;

    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    updateProfile(patch);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          maxLength={30}
          disabled={!canEditUsername}
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:cursor-not-allowed disabled:opacity-70"
        />
        <p className="text-xs text-muted-foreground">
          {canEditUsername
            ? "For better anonymity, avoid using your real name. Username can be changed once."
            : "Username change already used. You can only change username once."}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          type="tel"
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <p className="text-xs text-muted-foreground">Optional. Add a phone number for account recovery and extra security.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Email</label>
        <input
          value={user?.email ?? ""}
          disabled
          className="w-full h-10 px-3 rounded-xl bg-muted/30 border-0 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed after registration.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">EchoID</label>
        <input
          value={`@${user?.echoId ?? ""}`}
          disabled
          className="w-full h-10 px-3 rounded-xl bg-muted/30 border-0 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">Your unique EchoID is permanent.</p>
      </div>

      <button
        onClick={handleSave}
        disabled={isUpdatingProfile}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isUpdatingProfile ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isUpdatingProfile ? "Saving..." : "Save profile"}
      </button>

      {!isUpdatingProfile && !hasChanges && (
        <p className="text-xs text-muted-foreground text-center">No unsaved changes.</p>
      )}
    </div>
  );
}
