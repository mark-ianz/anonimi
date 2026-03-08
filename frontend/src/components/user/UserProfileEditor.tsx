"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/user";
import { Save } from "lucide-react";

export default function UserProfileEditor() {
  const { user, updateProfile, isUpdatingProfile } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  function handleSave() {
    const patch: Partial<Pick<AuthUser, "username" | "phone">> = {};
    if (username.trim() && username.trim() !== user?.username) patch.username = username.trim();
    if (phone.trim() !== (user?.phone ?? "")) patch.phone = phone.trim() || undefined;
    if (Object.keys(patch).length > 0) updateProfile(patch);
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
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
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
        Save profile
      </button>
    </div>
  );
}
