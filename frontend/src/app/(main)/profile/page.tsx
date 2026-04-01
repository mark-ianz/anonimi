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

export default function ProfilePage() {
  const { user, logout, isUpdatingAvatar, isUpdatingProfile } = useAuth();
  const [pendingAvatar, setPendingAvatar] = useState<PendingAvatar | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarSelect = (file: File, source: UploadSource) => {
    setPendingAvatar({ file, source });
    setAvatarPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleAvatarSaved = () => {
    setPendingAvatar(null);
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
              onSelectAvatar={handleAvatarSelect}
              isSaving={isSaving}
            />
          </div>

          {/* User info */}
          <div className="text-center space-y-0.5">
            <p className="font-display font-semibold text-lg">{user?.username}</p>
            <p className="text-sm text-muted-foreground">@{user?.echoId}</p>
          </div>

          {/* Edit form */}
          <UserProfileEditor
            pendingAvatar={pendingAvatar}
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
