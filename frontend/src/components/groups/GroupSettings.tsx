"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useGroup } from "@/hooks/useGroups";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { Group } from "@/types/group";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Camera, Save, Link as LinkIcon, QrCode, Copy, Check, X, AlertCircle, LogOut, Trash2, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import GroupAvatar from "@/components/shared/GroupAvatar";
import { UploadSource, validateUploadFile } from "@/lib/uploadPolicy";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface GroupSettingsProps {
  group: Group;
}

interface GroupSavePlan {
  payload: {
    name?: string;
    description?: string;
    image?: string | null;
    settings?: {
      joinRequestEnabled?: boolean;
      nicknameEditPolicy?: "admins_only" | "all_members";
      groupProfileEditPolicy?: "admins_only" | "all_members";
    };
  };
  changesSummary: string;
}

export default function GroupSettings({ group }: GroupSettingsProps) {
  const router = useRouter();
  const { updateGroupAsync, inviteLinks, createInviteLink, revokeInviteLink, joinRequests, decideJoinRequest, leaveGroup, disbandGroup, isLeaving, isDisbanding, members } = useGroup(group.id);
  const { upload, isUploading } = useMediaUpload();
  const canManageSettings = group.myRole === "owner" || group.myRole === "admin";
  const canEditGroupProfile =
    canManageSettings || (group.settings.groupProfileEditPolicy ?? "admins_only") === "all_members";
  const isOwner = group.myRole === "owner";

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [joinRequestEnabled, setJoinRequestEnabled] = useState(
    group.settings.joinRequestEnabled
  );
  const [nicknameEditPolicy, setNicknameEditPolicy] = useState<"admins_only" | "all_members">(
    group.settings.nicknameEditPolicy ?? "all_members"
  );
  const [groupProfileEditPolicy, setGroupProfileEditPolicy] = useState<"admins_only" | "all_members">(
    group.settings.groupProfileEditPolicy ?? "admins_only"
  );

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<30 | 60 | 360 | 1440 | 10080>(60);
  const [maxUses, setMaxUses] = useState<number>(0);
  const [inviteDescription, setInviteDescription] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showDisbandConfirmModal, setShowDisbandConfirmModal] = useState(false);
  const [disbandConfirmText, setDisbandConfirmText] = useState("");
  const [showDeleteChatConfirmModal, setShowDeleteChatConfirmModal] = useState(false);
  const [deleteConversationConfirmText, setDeleteConversationConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);
  const [pendingGroupImage, setPendingGroupImage] = useState<{ file: File; source: UploadSource } | null>(null);
  const [pendingGroupImageRemoval, setPendingGroupImageRemoval] = useState(false);
  const [groupImagePreviewUrl, setGroupImagePreviewUrl] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [savePlan, setSavePlan] = useState<GroupSavePlan | null>(null);

  const expiryOptions: Array<{ value: 30 | 60 | 360 | 1440 | 10080; label: string }> = [
    { value: 30, label: "30m" },
    { value: 60, label: "1h" },
    { value: 360, label: "6h" },
    { value: 1440, label: "24h" },
    { value: 10080, label: "7d" },
  ];
  const expiryIndex = expiryOptions.findIndex((o) => o.value === selectedExpiry);
  const fallbackProfileImages = members.slice(0, 3).map((member) => member.profileImage ?? null);
  const displayedGroupImage = pendingGroupImageRemoval ? null : (groupImagePreviewUrl ?? group.image ?? null);
  const hasGroupProfileChanges =
    name.trim() !== group.name.trim() ||
    description.trim() !== (group.description ?? "").trim() ||
    !!pendingGroupImage ||
    pendingGroupImageRemoval;
  const hasGroupSettingsChanges =
    canManageSettings &&
    (joinRequestEnabled !== group.settings.joinRequestEnabled ||
      nicknameEditPolicy !== (group.settings.nicknameEditPolicy ?? "all_members") ||
      groupProfileEditPolicy !== (group.settings.groupProfileEditPolicy ?? "admins_only"));
  const hasUnsavedChanges = hasGroupProfileChanges || hasGroupSettingsChanges;

  const deleteChatMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/conversations/${group.conversationId}`);
    },
    onSuccess: () => {
      toast.success("Chat deleted.");
      setShowDeleteChatConfirmModal(false);
      router.push("/chat");
    },
    onError: () => toast.error("Failed to delete chat."),
  });

  useEffect(() => {
    return () => {
      if (groupImagePreviewUrl) {
        URL.revokeObjectURL(groupImagePreviewUrl);
      }
    };
  }, [groupImagePreviewUrl]);

  useEffect(() => {
    if (!avatarPopoverOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(event.target as Node)) {
        setAvatarPopoverOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [avatarPopoverOpen]);

  function buildSavePlan(): GroupSavePlan | null {
    if (!canEditGroupProfile && !canManageSettings) return null;

    const payload: {
      name?: string;
      description?: string;
      image?: string | null;
      settings?: {
        joinRequestEnabled?: boolean;
        nicknameEditPolicy?: "admins_only" | "all_members";
        groupProfileEditPolicy?: "admins_only" | "all_members";
      };
    } = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    const changes: string[] = [];

    const originalName = group.name.trim();
    const nextName = name.trim();
    if (nextName !== originalName) {
      changes.push(`Name: ${originalName} -> ${nextName || "(empty)"}`);
    }

    const originalDescription = (group.description ?? "").trim();
    const nextDescription = description.trim();
    if (nextDescription !== originalDescription) {
      changes.push(
        `Description: ${originalDescription || "(empty)"} -> ${nextDescription || "(empty)"}`
      );
    }

    if (canManageSettings) {
      payload.settings = {
        joinRequestEnabled,
        nicknameEditPolicy,
        groupProfileEditPolicy,
      };

      if (joinRequestEnabled !== group.settings.joinRequestEnabled) {
        changes.push(`Join requests: ${joinRequestEnabled ? "Required" : "Not required"}`);
      }

      if (nicknameEditPolicy !== (group.settings.nicknameEditPolicy ?? "all_members")) {
        changes.push(
          `Nickname editing: ${nicknameEditPolicy === "admins_only" ? "Admins only" : "All members"}`
        );
      }

      if (groupProfileEditPolicy !== (group.settings.groupProfileEditPolicy ?? "admins_only")) {
        changes.push(
          `Group profile editing: ${groupProfileEditPolicy === "admins_only" ? "Admins only" : "All members"}`
        );
      }
    }

    if (pendingGroupImage) {
      changes.push(`Group photo: ${pendingGroupImage.file.name}`);
    } else if (pendingGroupImageRemoval) {
      changes.push("Group photo: Remove current photo");
    }

    if (changes.length === 0) {
      toast.info("No changes to save.");
      return null;
    }

    return {
      payload,
      changesSummary: changes.join("; "),
    };
  }

  function handleSave() {
    const plan = buildSavePlan();
    if (!plan) return;

    setSavePlan(plan);
    setSaveConfirmOpen(true);
  }

  async function handleConfirmSave() {
    if (!savePlan) return;

    const payload = { ...savePlan.payload };

    if (pendingGroupImage) {
      const result = await upload(pendingGroupImage.file, "group", { source: pendingGroupImage.source });
      if (!result) return;
      payload.image = result.url;
    } else if (pendingGroupImageRemoval) {
      payload.image = null;
    }

    try {
      await updateGroupAsync(payload);
      setPendingGroupImage(null);
      setPendingGroupImageRemoval(false);
      setGroupImagePreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setSaveConfirmOpen(false);
      setSavePlan(null);
      router.push(`/chat/${group.conversationId}`);
    } catch {
      // Error toast is already handled by the mutation hook.
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, source: UploadSource = "file") {
    if (!canEditGroupProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, { category: "group", source });
    if (!validation.ok) {
      toast.error(validation.error ?? "Invalid file.");
      e.target.value = "";
      return;
    }

    setPendingGroupImage({ file, source });
    setPendingGroupImageRemoval(false);
    setGroupImagePreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(file);
    });
    e.target.value = "";
  }

  function handleRemoveImage() {
    if (!canEditGroupProfile) return;
    setPendingGroupImage(null);
    setPendingGroupImageRemoval(true);
    setGroupImagePreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return null;
    });
  }

  function handleCreateInvite() {
    createInviteLink({
      expiryMinutes: selectedExpiry,
      maxUses: maxUses > 0 ? maxUses : undefined,
      description: inviteDescription || undefined
    });
    setShowInviteModal(false);
    setInviteDescription("");
    setMaxUses(0);
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    toast.success("Link copied!");
    setTimeout(() => setCopiedLink(null), 2000);
  }

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg">Group Settings</h2>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className={cn("relative", !canEditGroupProfile && "opacity-60")} ref={popoverRef}>
          <button
            type="button"
            onClick={() => {
              if (!canEditGroupProfile || isUploading) return;
              setAvatarPopoverOpen((prev) => !prev);
            }}
            className={cn(canEditGroupProfile ? "cursor-pointer" : "cursor-not-allowed", "group block")}
            aria-haspopup="menu"
            aria-expanded={avatarPopoverOpen}
            aria-label="Group photo options"
          >
          <GroupAvatar
            imageUrl={displayedGroupImage}
            fallbackProfileImages={fallbackProfileImages}
            name={group.name}
            alt={group.name}
            className="w-20 h-20"
            roundedClassName="rounded-2xl"
            textClassName="text-2xl"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <div className="flex items-center gap-1 text-white">
                <Camera className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>
          </button>

          {avatarPopoverOpen && canEditGroupProfile && (
            <div className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border/60 bg-card/95 p-1 shadow-elevated backdrop-blur-sm animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setAvatarPopoverOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
              >
                <Upload className="h-4 w-4" />
                Select photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarPopoverOpen(false);
                  handleRemoveImage();
                }}
                disabled={!displayedGroupImage || isUploading}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove photo
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif"
            className="hidden"
            onChange={(event) => handleImageChange(event, "file")}
            disabled={!canEditGroupProfile}
          />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEditGroupProfile}
          maxLength={100}
          className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEditGroupProfile}
          maxLength={500}
          rows={3}
          placeholder="Add a description for this group..."
          className="w-full px-3 py-2 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none disabled:opacity-60"
        />
      </div>

      {/* Policy toggles */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={!canManageSettings}
          onClick={() => setJoinRequestEnabled((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left",
            !canManageSettings && "opacity-60 cursor-not-allowed"
          )}
        >
          <div>
            <p className="text-sm font-medium">Require join requests</p>
            <p className="text-xs text-muted-foreground">New members need approval to join</p>
          </div>
          <span
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
              joinRequestEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                joinRequestEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </span>
        </button>

        {canManageSettings && (
          <button
            type="button"
            onClick={() =>
              setGroupProfileEditPolicy((current) =>
                current === "admins_only" ? "all_members" : "admins_only"
              )
            }
            className="flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left"
          >
            <div>
              <p className="text-sm font-medium">Admins-only group profile editing</p>
              <p className="text-xs text-muted-foreground">Turn off to let all members edit group photo, name, and description</p>
            </div>
            <span
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                groupProfileEditPolicy === "admins_only" ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                  groupProfileEditPolicy === "admins_only" ? "translate-x-5" : "translate-x-0"
                )}
              />
            </span>
          </button>
        )}

        {canManageSettings && (
          <button
            type="button"
            onClick={() =>
              setNicknameEditPolicy((current) =>
                current === "admins_only" ? "all_members" : "admins_only"
              )
            }
            className="flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left"
          >
            <div>
              <p className="text-sm font-medium">Admins-only nickname editing</p>
              <p className="text-xs text-muted-foreground">Turn off to allow all members to edit nicknames</p>
            </div>
            <span
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                nicknameEditPolicy === "admins_only" ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                  nicknameEditPolicy === "admins_only" ? "translate-x-5" : "translate-x-0"
                )}
              />
            </span>
          </button>
        )}
      </div>

      {canEditGroupProfile && (
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isUploading}
          className={cn(
            "w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
            hasUnsavedChanges && !isUploading
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Save className="w-4 h-4" />
          Save changes
        </button>
      )}

      {/* Invite Links Section */}
      <div className="border-t border-border/30 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Invite Links</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Create Link
          </button>
        </div>

        {inviteLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No invite links yet</p>
        ) : (
          <div className="space-y-2">
            {inviteLinks.map((link) => (
              <div key={link.inviteLinkId} className="p-3 rounded-xl bg-muted/40 border border-border/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.joinUrl}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                      {link.maxUses && <span>• {link.usedCount}/{link.maxUses} uses</span>}
                    </div>
                    {link.createdBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Created by {link.createdBy.username} (@{link.createdBy.echoId})
                      </p>
                    )}
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyLink(link.joinUrl)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title="Copy link"
                    >
                      {copiedLink === link.joinUrl ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {link.qrCode && (
                      <button
                        onClick={() => window.open(link.qrCode, "_blank")}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="View QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {!link.revokedAt && (
                      <button
                        onClick={() => revokeInviteLink(link.inviteLinkId)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        title="Revoke link"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {link.revokedAt && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Revoked
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Requests Section */}
      {joinRequests.length > 0 && (
        <div className="border-t border-border/30 pt-6 space-y-4">
          <h3 className="font-display font-semibold">Join Requests</h3>
          <div className="space-y-2">
            {joinRequests.map((req) => (
              <div key={req.requestId} className="p-3 rounded-xl bg-muted/40 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {req.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{req.user.username}</p>
                    <p className="text-xs text-muted-foreground">@{req.user.echoId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideJoinRequest({ requestId: req.requestId, action: "approve" })}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decideJoinRequest({ requestId: req.requestId, action: "reject" })}
                      className="px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border/30 pt-6 space-y-2">
        <h3 className="font-display font-semibold text-destructive">Danger Zone</h3>
        <button
          onClick={() => {
            setShowDeleteChatConfirmModal(true);
            setDeleteConversationConfirmText("");
          }}
          disabled={deleteChatMutation.isPending}
          className="w-full h-10 rounded-xl bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {deleteChatMutation.isPending ? "Deleting..." : "Delete Conversation"}
        </button>
        <button
          onClick={() => leaveGroup(undefined, { onSuccess: () => router.push("/chat") })}
          disabled={isLeaving}
          className="w-full h-10 rounded-xl bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isLeaving ? "Leaving..." : "Leave Group"}
        </button>
        {isOwner && (
          <button
            onClick={() => setShowDisbandConfirmModal(true)}
            disabled={isDisbanding}
            className="w-full h-10 rounded-xl bg-destructive/15 text-destructive text-sm font-medium hover:bg-destructive/25 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDisbanding ? "Disbanding..." : "Disband Group"}
          </button>
        )}
      </div>

      {showDisbandConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (isDisbanding) return;
              setShowDisbandConfirmModal(false);
              setDisbandConfirmText("");
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated space-y-4">
            <h3 className="font-display font-semibold text-base">Disband Group</h3>
            <p className="text-sm text-muted-foreground">
              This will lock the group permanently. Members keep chat history but can no longer send messages.
            </p>
            <p className="text-xs text-muted-foreground">
              Type <span className="font-semibold text-foreground">DISBAND {group.name}</span> to confirm.
            </p>

            <input
              value={disbandConfirmText}
              onChange={(event) => setDisbandConfirmText(event.target.value)}
              placeholder={`DISBAND ${group.name}`}
              className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm"
              autoFocus
              disabled={isDisbanding}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDisbandConfirmModal(false);
                  setDisbandConfirmText("");
                }}
                disabled={isDisbanding}
                className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  disbandGroup(undefined, {
                    onSuccess: () => {
                      setShowDisbandConfirmModal(false);
                      setDisbandConfirmText("");
                      router.push(`/chat/${group.conversationId}`);
                    },
                  })
                }
                disabled={isDisbanding || disbandConfirmText !== `DISBAND ${group.name}`}
                className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {isDisbanding ? "Disbanding..." : "Disband"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteChatConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (deleteChatMutation.isPending) return;
              setShowDeleteChatConfirmModal(false);
              setDeleteConversationConfirmText("");
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated space-y-4">
            <h3 className="font-display font-semibold text-base text-destructive">Delete Conversation</h3>
            <p className="text-sm text-muted-foreground">
              This clears your existing messages in this conversation. New messages can make it appear again.
            </p>
            <p className="text-xs text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>

            <input
              value={deleteConversationConfirmText}
              onChange={(event) => setDeleteConversationConfirmText(event.target.value)}
              placeholder="DELETE"
              className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm"
              autoFocus
              disabled={deleteChatMutation.isPending}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteChatConfirmModal(false);
                  setDeleteConversationConfirmText("");
                }}
                disabled={deleteChatMutation.isPending}
                className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteChatMutation.mutate()}
                disabled={deleteChatMutation.isPending || deleteConversationConfirmText !== "DELETE"}
                className="flex-1 h-10 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {deleteChatMutation.isPending ? "Deleting..." : "Delete Conversation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <div className="relative glass rounded-2xl w-full max-w-sm shadow-elevated p-4 space-y-4">
            <h3 className="font-display font-semibold">Create Invite Link</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Expires in</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={expiryOptions.length - 1}
                    step={1}
                    value={Math.max(expiryIndex, 0)}
                    onChange={(e) => setSelectedExpiry(expiryOptions[Number(e.target.value)]!.value)}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    {expiryOptions.map((option) => (
                      <span key={option.value}>{option.label}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Max uses (optional)</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {maxUses === 0 ? "Unlimited uses" : `${maxUses} uses`}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={inviteDescription}
                  onChange={(e) => setInviteDescription(e.target.value)}
                  placeholder="What's this link for?"
                  maxLength={200}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 h-10 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvite}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={saveConfirmOpen}
        onClose={() => {
          if (isUploading) return;
          setSaveConfirmOpen(false);
          setSavePlan(null);
        }}
        onConfirm={handleConfirmSave}
        title="Confirm group changes"
        description={savePlan?.changesSummary}
        confirmLabel="Save changes"
        cancelLabel="Review again"
        loading={isUploading}
      />
    </div>
  );
}
