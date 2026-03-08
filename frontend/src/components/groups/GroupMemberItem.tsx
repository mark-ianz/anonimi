"use client";

import { useState } from "react";
import { Shield, Crown, MoreVertical, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupMember, GroupRole } from "@/types/group";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface GroupMemberItemProps {
  member: GroupMember;
  currentUserRole: GroupRole;
  currentUserId: string;
  onRemove?: (userId: string) => void;
  onChangeRole?: (userId: string, role: GroupRole) => void;
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

export default function GroupMemberItem({
  member,
  currentUserRole,
  currentUserId,
  onRemove,
  onChangeRole,
}: GroupMemberItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isSelf = member.userId === currentUserId;
  const canManage =
    !isSelf &&
    member.role !== "owner" &&
    (currentUserRole === "owner" || (currentUserRole === "admin" && member.role === "member"));

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group border-b border-border/20">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
          {member.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.profileImage} alt={member.username} className="w-full h-full object-cover" />
          ) : (
            member.username[0].toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">
              {member.nickname ?? member.username}
            </span>
            <RoleIcon role={member.role} />
          </div>
          <p className="text-xs text-muted-foreground truncate">@{member.echoId}</p>
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
        {canManage && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-[160px] animate-fade-in">
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
                  </>
                )}
                <button
                  onClick={() => { setConfirmRemove(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => { onRemove?.(member.userId); setConfirmRemove(false); }}
        title="Remove member?"
        description={`Remove ${member.nickname ?? member.username} from the group?`}
        confirmLabel="Remove"
        variant="destructive"
      />
    </>
  );
}
