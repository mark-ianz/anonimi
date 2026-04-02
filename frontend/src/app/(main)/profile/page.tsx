"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AvatarUpload from "@/components/user/AvatarUpload";
import UserProfileEditor from "@/components/user/UserProfileEditor";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import type { UploadSource } from "@/lib/uploadPolicy";
import { useTempCountdown } from "@/hooks/useTempCountdown";
import { toast } from "sonner";
import { savePendingVerification } from "@/lib/verification";

interface PendingAvatar {
  file: File;
  source: UploadSource;
}

type PendingAvatarChange =
  | { type: "upload"; file: File; source: UploadSource }
  | { type: "remove" }
  | null;

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    logout,
    isUpdatingAvatar,
    isUpdatingProfile,
    claimTemporaryAccountAsync,
    isClaimingTemporary,
  } = useAuth();
  const [pendingAvatarChange, setPendingAvatarChange] = useState<PendingAvatarChange>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimConfirm, setClaimConfirm] = useState("");
  const { remainingLabel: tempRemaining } = useTempCountdown(user?.tempExpiresAt ?? null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarSelect = (file: File, source: UploadSource) => {
    setPendingAvatarChange({ type: "upload", file, source });
    setAvatarPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleAvatarRemove = () => {
    setPendingAvatarChange({ type: "remove" });
    setAvatarPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
  };

  const handleAvatarSaved = () => {
    setPendingAvatarChange(null);
    setAvatarPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
  };

  const isSaving = isUpdatingAvatar || isUpdatingProfile;
  const isTempUser = !!user?.isTemporary;

  const handleClaim = async () => {
    if (!isTempUser) return;
    const normalizedEmail = claimEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Email is required to claim your account.");
      return;
    }
    if (!claimPassword) {
      toast.error("Password is required to claim your account.");
      return;
    }
    if (claimPassword !== claimConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await claimTemporaryAccountAsync({ email: normalizedEmail, password: claimPassword });
      savePendingVerification({ type: "email", target: normalizedEmail });
      toast.success("Verification code sent. Check your email.");
      router.push(`/verify?target=${encodeURIComponent(normalizedEmail)}&type=email`);
    } catch {
      // Error toast handled in hook.
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-lg mx-auto w-full">
          <h1 className="text-xl font-display font-semibold">Your Profile</h1>

          {/* Avatar */}
          <div className="flex justify-center">
            <AvatarUpload
              size="lg"
              previewUrl={avatarPreviewUrl}
              pendingRemoval={pendingAvatarChange?.type === "remove"}
              onSelectAvatar={handleAvatarSelect}
              onRemoveAvatar={handleAvatarRemove}
              isSaving={isSaving}
            />
          </div>

          {/* User info */}
          <div className="text-center space-y-0.5">
            <p className="font-display font-semibold text-lg">{user?.username}</p>
            <p className="text-sm text-muted-foreground">@{user?.anonimiId}</p>
          </div>

          {/* Edit form */}
          <UserProfileEditor
            pendingAvatar={
              pendingAvatarChange?.type === "upload"
                ? { file: pendingAvatarChange.file, source: pendingAvatarChange.source }
                : null
            }
            pendingAvatarRemoval={pendingAvatarChange?.type === "remove"}
            onAvatarSaved={handleAvatarSaved}
          />

          {isTempUser && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Temporary account</p>
                  <p className="text-xs text-muted-foreground">
                    Claim your account to keep access after the session ends.
                  </p>
                </div>
                {tempRemaining && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {tempRemaining}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <input
                  value={claimEmail}
                  onChange={(event) => setClaimEmail(event.target.value)}
                  placeholder="Email address"
                  type="email"
                  className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm"
                />
                <input
                  value={claimPassword}
                  onChange={(event) => setClaimPassword(event.target.value)}
                  placeholder="Create a password"
                  type="password"
                  className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm"
                />
                <input
                  value={claimConfirm}
                  onChange={(event) => setClaimConfirm(event.target.value)}
                  placeholder="Confirm password"
                  type="password"
                  className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm"
                />
              </div>

              <button
                onClick={handleClaim}
                disabled={isClaimingTemporary}
                className="w-full h-10 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-600/90 transition-colors disabled:opacity-60"
              >
                {isClaimingTemporary ? "Claiming..." : "Claim account"}
              </button>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full h-10 rounded-xl border border-destructive/40 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
