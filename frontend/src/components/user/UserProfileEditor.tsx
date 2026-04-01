"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/user";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { UploadSource } from "@/lib/uploadPolicy";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface PendingAvatar {
  file: File;
  source: UploadSource;
}

interface UserProfileEditorProps {
  pendingAvatar?: PendingAvatar | null;
  onAvatarSaved?: () => void;
}

interface SavePlan {
  patch: Partial<Pick<AuthUser, "username" | "phone">>;
  changesSummary: string;
}

export default function UserProfileEditor({ pendingAvatar, onAvatarSaved }: UserProfileEditorProps) {
  const {
    user,
    updateProfileAsync,
    updateAvatarAsync,
    isUpdatingProfile,
    isUpdatingAvatar,
  } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savePlan, setSavePlan] = useState<SavePlan | null>(null);
  const canEditUsername = user?.usernameCanEdit ?? false;
  const isSaving = isUpdatingProfile || isUpdatingAvatar;

  const trimmedUsername = username.trim();
  const trimmedPhone = phone.trim();
  const hasChanges =
    (trimmedUsername && trimmedUsername !== (user?.username ?? "")) ||
    trimmedPhone !== (user?.phone ?? "") ||
    !!pendingAvatar;
  const canSave = hasChanges && !isSaving;

  function buildSavePlan(): SavePlan | null {
    const patch: Partial<Pick<AuthUser, "username" | "phone">> = {};
    const nextUsername = trimmedUsername;
    const changes: string[] = [];

    if (nextUsername && nextUsername !== user?.username) {
      if (nextUsername.length < 3 || nextUsername.length > 30) {
        toast.error("Username must be between 3 and 30 characters.");
        return null;
      }

      if (!/^[a-zA-Z0-9_.]+$/.test(nextUsername)) {
        toast.error("Username can only contain letters, numbers, underscores, and periods.");
        return null;
      }

      patch.username = nextUsername;
      changes.push(`Username: ${user?.username ?? "(empty)"} -> ${nextUsername}`);
    }

    if (trimmedPhone !== (user?.phone ?? "")) {
      patch.phone = trimmedPhone || undefined;
      const previousPhone = user?.phone?.trim() ? user.phone : "(empty)";
      const nextPhone = trimmedPhone || "(empty)";
      changes.push(`Phone: ${previousPhone} -> ${nextPhone}`);
    }

    if (pendingAvatar) {
      changes.push(`Profile photo: ${pendingAvatar.file.name}`);
    }

    if (Object.keys(patch).length === 0 && !pendingAvatar) {
      toast.info("No changes to save.");
      return null;
    }

    return {
      patch,
      changesSummary: changes.join("; "),
    };
  }

  function handleSave() {
    const plan = buildSavePlan();
    if (!plan) return;

    setSavePlan(plan);
    setConfirmOpen(true);
  }

  async function handleConfirmSave() {
    if (!savePlan) return;

    let savedProfile = false;
    let savedAvatar = false;

    if (Object.keys(savePlan.patch).length > 0) {
      try {
        await updateProfileAsync(savePlan.patch);
        savedProfile = true;
      } catch {
        // Error toast is handled in hook.
      }
    }

    if (pendingAvatar) {
      try {
        await updateAvatarAsync(pendingAvatar.file, pendingAvatar.source);
        savedAvatar = true;
        onAvatarSaved?.();
      } catch {
        // Error toast is handled in hook.
      }
    }

    if (!savedProfile && !savedAvatar) {
      return;
    }

    setConfirmOpen(false);
    setSavePlan(null);

    if (savedAvatar && !savedProfile) {
      toast.success("Profile photo updated.");
      return;
    }

    if (savedProfile) {
      // updateProfile mutation already displays success toast.
      return;
    }
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
        disabled={!canSave}
        className={
          "w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors " +
          (canSave
            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed")
        }
      >
        {isSaving ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? "Saving..." : "Save profile"}
      </button>

      {!isSaving && !!pendingAvatar && (
        <p className="text-xs text-primary text-center">New profile photo selected. Click Save profile to apply.</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (isSaving) return;
          setConfirmOpen(false);
          setSavePlan(null);
        }}
        onConfirm={handleConfirmSave}
        title="Confirm profile changes"
        description={savePlan?.changesSummary}
        confirmLabel="Save changes"
        cancelLabel="Review again"
        loading={isSaving}
      />
    </div>
  );
}
