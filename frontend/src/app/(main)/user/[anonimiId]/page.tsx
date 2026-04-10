"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Ban, Flag, SendHorizontal, MoreHorizontal, X } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import type { PublicUser } from "@/types/user";
import type { ReportReason } from "@/types/report";
import OnlineIndicator from "@/components/user/OnlineIndicator";
import UserAvatar from "@/components/shared/UserAvatar";
import { useEffect, useRef, useState } from "react";
import TemporaryAccountBadge from "@/components/shared/TemporaryAccountBadge";
import TemporaryAccountModal from "@/components/shared/TemporaryAccountModal";

export default function UserProfilePage() {
  const { anonimiId } = useParams<{ anonimiId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const [reportReason, setReportReason] = useState<ReportReason>("harassment");
  const [reportDescription, setReportDescription] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [tempGateOpen, setTempGateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const lookupId = `/users/${anonimiId}`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", anonimiId],
    queryFn: async () => {
      const res = await api.get(lookupId);
      return res.data.data as PublicUser;
    },
    enabled: !!anonimiId,
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const targetId = data?.anonimiId;
      if (!targetId) return;
      await api.post("/contacts/request", { targetAnonimiId: targetId });
    },
    onSuccess: () => {
      toast.success("Contact request sent");
      queryClient.invalidateQueries({ queryKey: ["user-profile", anonimiId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to send request");
    },
  });

  const cancelContactRequestMutation = useMutation({
    mutationFn: async () => {
      await api.post("/contacts/request/cancel", { targetAnonimiId: anonimiId });
    },
    onSuccess: () => {
      toast.success("Contact request withdrawn");
      queryClient.invalidateQueries({ queryKey: ["user-profile", anonimiId] });
      queryClient.invalidateQueries({ queryKey: ["contacts", "requests"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to withdraw request");
    },
  });

  const removeContactMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Missing contact id");
      await api.delete(`/contacts/${profile.id}`);
    },
    onSuccess: () => {
      toast.success("Contact removed");
      queryClient.invalidateQueries({ queryKey: ["user-profile", anonimiId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts", "requests"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg ?? "Failed to remove contact");
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post("/blocks", { targetAnonimiId: anonimiId });
    },
    onSuccess: () => {
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["user-profile", anonimiId] });
    },
    onError: () => {
      toast.error("Failed to block user");
    },
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/conversations", { participantAnonimiId: anonimiId });
      return res.data.data as { conversationId: string };
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

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Missing target user");
      await api.post("/reports", {
        targetType: "user",
        targetId: profile.id,
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Report submitted. Thank you.");
      setReportDescription("");
      setReportModalOpen(false);
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });

  const profile = data;
  const isTempUser = !!me?.isTemporary;
  const isTempProfile = !!profile?.isTemporary;
  const isMe = profile?.id === me?.id;
  const isContact = !!profile?.isContact;
  const hasOutgoingRequest = !!profile?.pendingOutgoingRequestId;
  const hasIncomingRequest = !!profile?.pendingIncomingRequestId;
  const isContactActionPending =
    addContactMutation.isPending ||
    cancelContactRequestMutation.isPending ||
    removeContactMutation.isPending;

  const handleContactAction = () => {
    if (!profile) return;

    if (isContact) {
      const confirmed = window.confirm(`Remove @${profile.anonimiId} from your contacts?`);
      if (!confirmed) return;
      removeContactMutation.mutate();
      return;
    }

    if (hasOutgoingRequest) {
      cancelContactRequestMutation.mutate();
      return;
    }

    if (hasIncomingRequest) {
      router.push("/contacts?tab=requests");
      return;
    }

    addContactMutation.mutate();
  };

  useEffect(() => {
    if (!menuOpen && !reportModalOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setReportModalOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, reportModalOpen]);

  return (
    <ProtectedRoute>
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-border/30 p-4">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
            <div>
              <p className="font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Public Profile
              </p>
              <h1 className="text-xl font-display font-semibold">User Details</h1>
            </div>
          </div>
        </div>

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
            <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/75 shadow-elevated">
                <div className="relative border-b border-border/60 bg-linear-to-br from-background via-card/80 to-muted/35 px-6 pb-6 pt-8 sm:px-8">
                  {!isMe && (
                    <div className="absolute right-4 top-4 z-10" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border/70 bg-card/85 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border/70 bg-card p-1.5 shadow-elevated">
                          <button
                            type="button"
                            disabled={blockMutation.isPending || !!profile.isBlocked}
                            onClick={() => {
                              setMenuOpen(false);
                              if (isTempUser) {
                                setTempGateOpen(true);
                                return;
                              }
                              blockMutation.mutate();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                          >
                            <Ban className="h-4 w-4" />
                            {profile.isBlocked ? "Blocked" : "Block User"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              if (isTempUser) {
                                setTempGateOpen(true);
                                return;
                              }
                              setReportModalOpen(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-300 cursor-pointer"
                          >
                            <Flag className="h-4 w-4" />
                            Report User
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
                    <div className="relative">
                      <UserAvatar
                        imageUrl={profile.profileImage}
                        name={profile.username}
                        className="h-28 w-28 shadow-elevated"
                        roundedClassName="rounded-full"
                        textClassName="text-4xl"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <OnlineIndicator status={profile.onlineStatus} size="md" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <h2 className="font-display text-3xl font-semibold leading-none">{profile.username}</h2>
                      {isTempProfile && <TemporaryAccountBadge />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">@{profile.anonimiId}</p>
                    {profile.contactNickname ? (
                      <p className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Saved as {profile.contactNickname}
                      </p>
                    ) : null}

                    <div className="mt-5 w-full rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      <p>
                        {profile.onlineStatus === "online"
                          ? "Active now"
                          : profile.onlineStatus === "away"
                          ? "Away"
                          : profile.onlineStatus === "dnd"
                          ? "Do Not Disturb"
                          : profile.lastSeen
                          ? `Last seen ${new Date(profile.lastSeen).toLocaleDateString()}`
                          : "Offline"}
                      </p>
                      {profile.createdAt ? (
                        <p className="mt-1">
                          Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!isMe && (
                  <div className="space-y-4 p-6 sm:p-8">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={handleContactAction}
                        disabled={isContactActionPending}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        {isContactActionPending ? (
                          <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ) : isContact ? (
                          <UserMinus className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {isContact
                          ? "Remove Contact"
                          : hasOutgoingRequest
                          ? "Withdraw Request"
                          : hasIncomingRequest
                          ? "Respond to Request"
                          : "Add Contact"}
                      </button>

                      <button
                        onClick={() => messageMutation.mutate()}
                        disabled={messageMutation.isPending}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        {messageMutation.isPending ? (
                          <div className="h-4 w-4 rounded-full border-2 border-foreground/40 border-t-foreground animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {reportModalOpen && !isMe && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setReportModalOpen(false)}>
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close report modal"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-semibold">Report Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Report @{profile.anonimiId}. Add optional context to help moderation.
              </p>

              <div className="mt-4 grid gap-2">
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="h-10 rounded-lg border border-border/70 bg-background px-2 text-sm"
                >
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="violence">Violence</option>
                  <option value="explicit_content">Explicit Content</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Optional details"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="h-9 rounded-lg border border-border/70 px-3 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => reportMutation.mutate()}
                  disabled={reportMutation.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500/15 px-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300 cursor-pointer"
                >
                  <Flag className="h-4 w-4" />
                  Submit Report
                  <SendHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <TemporaryAccountModal
          open={tempGateOpen}
          onClose={() => setTempGateOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
