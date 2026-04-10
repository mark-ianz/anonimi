"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, X, Camera, ChevronDown, Upload, Trash2 } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useGroups } from "@/hooks/useGroups";
import { useContacts } from "@/hooks/useContacts";
import { useDebounce } from "@/hooks/useDebounce";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { cn } from "@/lib/utils";
import { validateUploadFile, type UploadSource } from "@/lib/uploadPolicy";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import UserAvatar from "@/components/shared/UserAvatar";
import TemporaryAccountModal from "@/components/shared/TemporaryAccountModal";
import type { SearchUser } from "@/types/user";

export default function CreateGroupPage() {
  const router = useRouter();
  const { createGroup, isCreating } = useGroups();
  const { contacts } = useContacts();
  const { upload, isUploading } = useMediaUpload();
  const { user } = useAuthStore();
  const isTempUser = !!user?.isTemporary;
  const [tempGateOpen, setTempGateOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [joinRequestEnabled, setJoinRequestEnabled] = useState(true);
  const [groupProfileEditPolicy, setGroupProfileEditPolicy] = useState<"admins_only" | "all_members">("all_members");
  const [nicknameEditPolicy, setNicknameEditPolicy] = useState<"admins_only" | "all_members">("all_members");
  const [pendingGroupImage, setPendingGroupImage] = useState<{ file: File; source: UploadSource } | null>(null);
  const [groupImagePreviewUrl, setGroupImagePreviewUrl] = useState<string | null>(null);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const usersQuery = useQuery({
    queryKey: ["groups", "create", "users-search", debouncedSearchQuery],
    queryFn: async () => {
      const res = await api.get("/users/search", {
        params: { q: debouncedSearchQuery.trim(), limit: 20 },
      });
      return (res.data?.data ?? []) as SearchUser[];
    },
    enabled: debouncedSearchQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => {
    const n = c.nickname ?? c.username;
    return (
      n.toLowerCase().includes(normalizedQuery) ||
      c.anonimiId.toLowerCase().includes(normalizedQuery)
    );
  });
  const searchableUsers = (usersQuery.data ?? []).filter((candidate) => candidate.id !== user?.id);
  const displayedUsers =
    debouncedSearchQuery.trim().length >= 2
      ? searchableUsers
      : filteredContacts.map((contact) => ({
          id: contact.contactId,
          anonimiId: contact.anonimiId,
          username: contact.nickname ?? contact.username,
          profileImage: contact.profileImage,
          onlineStatus: contact.onlineStatus,
          isTemporary: false,
        }));

  function toggleContact(anonimiId: string) {
    setSelectedIds((prev) =>
      prev.includes(anonimiId)
        ? prev.filter((id) => id !== anonimiId)
        : [...prev, anonimiId]
    );
  }

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

  async function handleCreate() {
    if (isTempUser) {
      setTempGateOpen(true);
      return;
    }

    let image: string | undefined;

    if (pendingGroupImage) {
      const result = await upload(pendingGroupImage.file, "group", { source: pendingGroupImage.source });
      if (!result) return;
      image = result.url;
    }
    
    createGroup(
      {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        image,
        settings: {
          joinRequestEnabled,
          groupProfileEditPolicy,
          nicknameEditPolicy,
        },
        memberAnonimiIds: selectedIds,
      },
      {
        onSuccess: (createdGroup) => {
          if (createdGroup?.conversationId) {
            router.push(`/chat/${createdGroup.conversationId}`);
            return;
          }
          router.push("/chat");
        },
      }
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, source: UploadSource = "file") {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, { category: "group", source });
    if (!validation.ok) {
      e.target.value = "";
      return;
    }

    setPendingGroupImage({ file, source });
    setGroupImagePreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(file);
    });
    setAvatarPopoverOpen(false);
    e.target.value = "";
  }

  function handleRemoveImage() {
    setPendingGroupImage(null);
    setGroupImagePreviewUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return null;
    });
    setAvatarPopoverOpen(false);
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 border-b border-border/30">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 p-4">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display font-semibold">Create Group</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl p-4 space-y-6">
          {/* Group Avatar */}
          <div className="flex justify-center">
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => {
                  if (isUploading || isCreating) return;
                  setAvatarPopoverOpen((prev) => !prev);
                }}
                className="relative cursor-pointer group block"
                aria-haspopup="menu"
                aria-expanded={avatarPopoverOpen}
                aria-label="Group photo options"
              >
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-medium">
                {groupImagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={groupImagePreviewUrl} alt="Group" className="w-full h-full object-cover" />
                ) : name ? (
                  name.slice(0, 2).toUpperCase()
                ) : (
                  "G"
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 text-white">
                    <Camera className="w-5 h-5" />
                    <ChevronDown className="w-4 h-4" />
                  </div>
                )}
              </div>
              </button>

              {avatarPopoverOpen && (
                <div className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border/60 bg-card/95 p-1 shadow-elevated backdrop-blur-sm animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
                  >
                    <Upload className="h-4 w-4" />
                    Select photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={!groupImagePreviewUrl || isUploading || isCreating}
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
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate the group name
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this group..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Permission Settings */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setJoinRequestEnabled((v) => !v)}
              className="flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">Require join requests</p>
                <p className="text-xs text-muted-foreground">
                  New members need approval to join
                </p>
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

            <button
              type="button"
              onClick={() =>
                setGroupProfileEditPolicy((current) =>
                  current === "admins_only" ? "all_members" : "admins_only"
                )
              }
              className="flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">Admins-only group profile editing</p>
                <p className="text-xs text-muted-foreground">
                  Turn off to let all members edit group photo, name, and description
                </p>
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

            <button
              type="button"
              onClick={() =>
                setNicknameEditPolicy((current) =>
                  current === "admins_only" ? "all_members" : "admins_only"
                )
              }
              className="flex w-full items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30 text-left cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">Admins-only nickname editing</p>
                <p className="text-xs text-muted-foreground">
                  Turn off to allow all members to edit nicknames
                </p>
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
          </div>

          {/* Selected Members */}
          {selectedIds.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected ({selectedIds.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedIds.map((anonimiId) => {
                  const c = contacts.find((c) => c.anonimiId === anonimiId);
                  const foundUser = searchableUsers.find((candidate) => candidate.anonimiId === anonimiId);
                  return (
                    <span
                      key={anonimiId}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {c?.nickname ?? c?.username ?? foundUser?.username ?? anonimiId}
                      <button
                        onClick={() => toggleContact(anonimiId)}
                        className="hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add members</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any user by username or anonimi..."
              className="w-full h-10 px-3 rounded-xl bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {displayedUsers.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.anonimiId);
                return (
                  <button
                    key={candidate.id}
                    onClick={() => toggleContact(candidate.anonimiId)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <UserAvatar
                      imageUrl={candidate.profileImage}
                      name={candidate.username}
                      className="w-10 h-10 rounded-xl shrink-0"
                      roundedClassName="rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {candidate.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{candidate.anonimiId}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
              {usersQuery.isFetching && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Searching users...
                </p>
              )}
              {!usersQuery.isFetching && !displayedUsers.length && searchQuery && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30">
          <div className="mx-auto w-full max-w-3xl p-4">
            <button
              onClick={handleCreate}
              disabled={isCreating || isUploading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreating || isUploading ? (
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : null}
              Create Group {selectedIds.length > 0 ? `(${selectedIds.length} members)` : "(just you)"}
            </button>
          </div>
        </div>
      </div>

      <TemporaryAccountModal
        open={tempGateOpen}
        onClose={() => setTempGateOpen(false)}
      />
    </ProtectedRoute>
  );
}
