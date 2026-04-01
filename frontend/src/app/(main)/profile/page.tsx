"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AvatarUpload from "@/components/user/AvatarUpload";
import UserProfileEditor from "@/components/user/UserProfileEditor";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import type { UploadSource } from "@/lib/uploadPolicy";

interface PendingAvatar {
  file: File;
  source: UploadSource;
}

type PendingAvatarChange =
  | { type: "upload"; file: File; source: UploadSource }
  | { type: "remove" }
  | null;

export default function ProfilePage() {
  const { user, logout, isUpdatingAvatar, isUpdatingProfile } = useAuth();
  const [pendingAvatarChange, setPendingAvatarChange] = useState<PendingAvatarChange>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

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
