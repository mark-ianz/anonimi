"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, UserPlus, Ban } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { PublicUser } from "@/types/user";
import { API_BASE } from "@/lib/constants";
import OnlineIndicator from "@/components/user/OnlineIndicator";

export default function UserProfilePage() {
  const { echoId } = useParams<{ echoId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", echoId],
    queryFn: async () => {
      const res = await api.get(`/users/${echoId}`);
      return res.data.data as PublicUser;
    },
    enabled: !!echoId,
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      await api.post("/contacts/request", { targetEchoId: echoId });
    },
    onSuccess: () => {
      toast.success("Contact request sent");
      queryClient.invalidateQueries({ queryKey: ["user-profile", echoId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to send request");
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post("/blocks", { targetEchoId: echoId });
    },
    onSuccess: () => {
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["user-profile", echoId] });
    },
    onError: () => {
      toast.error("Failed to block user");
    },
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      // Find or create conversation — backend handles this via message request flow
      const res = await api.post("/messages", {
        targetEchoId: echoId,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    },
    onError: () => {
      toast.error("Failed to start conversation");
    },
  });

  const profile = data;
  const isMe = profile?.id === me?.id;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-semibold">Profile</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : error || !profile ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <p className="font-medium text-sm mb-1">User not found</p>
              <p className="text-xs text-muted-foreground">This profile doesn't exist or is unavailable.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6 max-w-lg mx-auto w-full">
              {/* Avatar + status */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {profile.profileImage ? (
                    <img
                      src={`${API_BASE.replace("/api", "")}${profile.profileImage}`}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full object-cover shadow-elevated"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center shadow-elevated">
                      <span className="text-3xl font-bold text-muted-foreground">
                        {profile.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1">
                    <OnlineIndicator status={profile.onlineStatus} size="md" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-xl">{profile.username}</p>
                  <p className="text-sm text-muted-foreground">@{profile.echoId}</p>
                  {profile.contactNickname && (
                    <p className="text-xs text-primary mt-1">Saved as &quot;{profile.contactNickname}&quot;</p>
                  )}
                </div>
              </div>

              {/* Status info */}
              <div className="bg-muted/40 border border-border/30 rounded-2xl p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {profile.onlineStatus === "online"
                    ? "Active now"
                    : profile.lastSeen
                    ? `Last seen ${new Date(profile.lastSeen).toLocaleDateString()}`
                    : "Offline"}
                </p>
                {profile.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Actions */}
              {!isMe && (
                <div className="space-y-2">
                  {profile.isContact ? (
                    <button
                      onClick={() => router.push(`/chat`)}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  ) : (
                    <button
                      onClick={() => addContactMutation.mutate()}
                      disabled={addContactMutation.isPending}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {addContactMutation.isPending ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Add Contact
                        </>
                      )}
                    </button>
                  )}

                  {!profile.isBlocked && (
                    <button
                      onClick={() => blockMutation.mutate()}
                      disabled={blockMutation.isPending}
                      className="w-full h-10 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {blockMutation.isPending ? (
                        <div className="w-4 h-4 rounded-full border-2 border-destructive border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Ban className="w-4 h-4" />
                          Block User
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
