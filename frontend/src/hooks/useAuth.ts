"use client";

import { useEffect } from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { disconnectSockets } from "@/lib/socket";
import type { AuthUser } from "@/types/user";

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, clearAuth, isLoading } = useAuthStore();

  // Fetch own profile and keep store in sync
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data as AuthUser;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  // Sync profile into store when fetched
  const profile = profileQuery.data;
  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {});
      }
    },
    onSettled: () => {
      clearAuth();
      disconnectSockets();
      qc.clear();
      router.push("/login");
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      const res = await api.post("/auth/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as { profileImage: string };
    },
    onSuccess: (data) => {
      if (user) setUser({ ...user, profileImage: data.profileImage });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => toast.error("Failed to update avatar."),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (patch: Partial<Pick<AuthUser, "username" | "phone" | "appearanceStatus">>) => {
      const res = await api.patch("/auth/me", patch);
      return res.data.data as AuthUser;
    },
    onSuccess: (data) => {
      setUser(data);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated.");
    },
    onError: (err: unknown) => {
      const responseError = (err as {
        response?: {
          data?: {
            error?: {
              message?: string;
              details?: Array<{ path?: string; message?: string }>;
            };
          };
        };
      })?.response?.data?.error;

      const detailMessage = responseError?.details?.[0]?.message;
      const msg = detailMessage ?? responseError?.message ?? "Failed to update profile.";
      toast.error(msg);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return {
    user: user ?? profile,
    isAuthenticated,
    isLoading: isLoading || profileQuery.isLoading,
    logout,
    updateAvatar: updateAvatarMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingAvatar: updateAvatarMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}
