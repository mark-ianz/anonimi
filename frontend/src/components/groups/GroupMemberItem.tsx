"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shield, Crown, MoreVertical, UserMinus, VolumeX, Volume2, User, MessageCircle, Pencil, ShieldBan } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupMember, GroupRole } from "@/types/group";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import UserAvatar from "@/components/shared/UserAvatar";

interface GroupMemberItemProps {
  member: GroupMember;
  currentUserRole: GroupRole;
  currentUserId: string;
  onRemove?: (userId: string) => void;
  onChangeRole?: (userId: string, role: GroupRole) => void;
  onMute?: (userId: string, durationMinutes: number) => void;
  onUnmute?: (userId: string) => void;
  onTransferOwnership?: (userId: string) => void;
  onSendMessage?: (anonimiId: string) => void;
  onSetNickname?: (userId: string, nickname: string | null) => void;
  onBlock?: (anonimiId: string) => void;
}

const roleLabels: Record<GroupRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const RoleIcon = ({ role }: { role: GroupRole }) => {
  if (role === "owner") return <Crown className="w-3.5 h-3.5 text-yellow-500" />;
  if (role === "admin") return <Shield className="w-3.5 h-3.5 text-blue-500" />;
  return null;
};

const getJoinSourceLabel = (member: GroupMember) => {
  const by = member.addedBy ? `${member.addedBy.username}` : null;
  if (member.joinedVia === "group_create") return "Created this group";
  if (member.joinedVia === "invite_link") return by ? `Joined via invite link from ${by}` : "Joined via invite link";
  if (member.joinedVia === "direct_request") return by ? `Joined by approval from ${by}` : "Joined via request approval";
  return by ? `Added by ${by}` : "Added by member";
};

export default function GroupMemberItem({
  member,
  currentUserRole,
  currentUserId,
  onRemove,
  onChangeRole,
  onMute,
  onUnmute,
  onTransferOwnership,
  onSendMessage,
  onSetNickname,
  onBlock,
}: GroupMemberItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showNicknameForm, setShowNicknameForm] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(member.nickname ?? "");
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [muteDuration, setMuteDuration] = useState(60);

  const isSelf = member.userId === currentUserId;
  const isOwner = currentUserRole === "owner";
  const isMemberOwner = member.role === "owner";
  const canManage =
    !isSelf &&
    member.role !== "owner" &&
    (currentUserRole === "owner" || (currentUserRole === "admin" && member.role === "member"));
  const canMute = canManage && !isMemberOwner;
  const canTransfer = isOwner && !isSelf && member.role !== "owner";
  const canShowAdminActions = canManage;
  
  const isMuted = member.mutedUntil && new Date(member.mutedUntil) > new Date();
  const muteOptions = [15, 60, 240, 1440, 10080];

  useEffect(() => {
    if (!menuOpen) return;
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [menuOpen]);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group border-b border-border/20">
        {/* Avatar */}
        <UserAvatar
          imageUrl={member.profileImage}
          name={member.username}
          className="w-10 h-10"
          roundedClassName="rounded-xl"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">
              {member.nickname ?? member.username}
            </span>
            <RoleIcon role={member.role} />
          </div>
          <p className="text-xs text-muted-foreground truncate">@{member.anonimiId}</p>
          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{getJoinSourceLabel(member)}</p>
        </div>

        {/* Role badge */}
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          member.role === "owner" ? "bg-yellow-500/10 text-yellow-600" :
          member.role === "admin" ? "bg-blue-500/10 text-blue-600" :
          "bg-muted text-muted-foreground"
        )}>
          {roleLabels[member.role]}
        </span>

        {/* Actions */}
        <div
          ref={menuRef}
          className={cn(
            "relative transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-40 animate-fade-in">
                <Link
                  href={`/user/${member.anonimiId}`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  View profile
                </Link>

                {!isSelf && (
                  <button
                    onClick={() => { onSendMessage?.(member.anonimiId); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send message
                  </button>
                )}

                <button
                  onClick={() => {
                    setNicknameValue(member.nickname ?? "");
                    setMenuOpen(false);
                    setShowNicknameForm(true);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Change nickname
                </button>

                {!isSelf && (
                  <button
                    onClick={() => { onBlock?.(member.anonimiId); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <ShieldBan className="w-4 h-4" />
                    Block
                  </button>
                )}

                {canShowAdminActions && (
                  <>
                    <div className="my-1 border-t border-border/30" />
                    <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Admin actions</p>
                  </>
                )}

                {currentUserRole === "owner" && (
                  <>
                    {member.role === "member" && (
                      <button
                        onClick={() => { onChangeRole?.(member.userId, "admin"); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Make admin
                      </button>
                    )}
                    {member.role === "admin" && (
                      <button
                        onClick={() => { onChangeRole?.(member.userId, "member"); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        Demote to member
                      </button>
                    )}
                    {canTransfer && (
                      <button
                        onClick={() => { onTransferOwnership?.(member.userId); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Transfer ownership
                      </button>
                    )}
                  </>
                )}
                {canMute && (
                  <>
                    {isMuted ? (
                      <button
                        onClick={() => { onUnmute?.(member.userId); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        Unmute
                      </button>
                    ) : (
                      <button
                        onClick={() => { setMenuOpen(false); setShowMuteDialog(true); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <VolumeX className="w-4 h-4" />
                        Mute
                      </button>
                    )}
                  </>
                )}
                {canShowAdminActions && (
                  <button
                    onClick={() => { setConfirmRemove(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            )}
        </div>
      </div>

      {showMuteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMuteDialog(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated space-y-4">
            <h3 className="text-base font-semibold">Mute {member.nickname ?? member.username}</h3>
            <p className="text-sm text-muted-foreground">
              Choose how long this member should be muted.
            </p>
            <select
              value={muteDuration}
              onChange={(event) => setMuteDuration(Number(event.target.value))}
              className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm"
            >
              {muteOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes >= 1440
                    ? `${minutes / 1440} day${minutes / 1440 === 1 ? "" : "s"}`
                    : minutes >= 60
                    ? `${minutes / 60} hour${minutes / 60 === 1 ? "" : "s"}`
                    : `${minutes} min`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMuteDialog(false)}
                className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onMute?.(member.userId, muteDuration);
                  setShowMuteDialog(false);
                }}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Mute
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => { onRemove?.(member.userId); setConfirmRemove(false); }}
        title="Remove member?"
        description={`Remove ${member.nickname ?? member.username} from the group?`}
        confirmLabel="Remove"
        variant="destructive"
      />

      {showNicknameForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNicknameForm(false);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl p-5 w-full max-w-sm shadow-elevated animate-fade-in">
            <h3 className="font-display font-semibold text-base mb-1">Change nickname</h3>
            <p className="text-xs text-muted-foreground mb-4">Set a custom name for this member in the group.</p>
            <input
              autoFocus
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
              maxLength={50}
              className="w-full h-10 px-3 rounded-xl bg-muted/60 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 mb-4"
              placeholder={`Nickname for ${member.username}...`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNicknameForm(false)}
                className="flex-1 h-10 rounded-xl border border-border/50 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSetNickname?.(member.userId, nicknameValue.trim() || null);
                  setShowNicknameForm(false);
                }}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
