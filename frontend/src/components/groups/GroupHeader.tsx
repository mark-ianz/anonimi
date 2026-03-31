"use client";

import { useState } from "react";
import { Settings, LogOut, MoreVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/group";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface GroupHeaderProps {
  group: Group;
  conversationId: string;
  onLeave: () => void;
  isLeaving?: boolean;
}

export default function GroupHeader({
  group,
  conversationId,
  onLeave,
  isLeaving,
}: GroupHeaderProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const canManage = group.myRole === "owner" || group.myRole === "admin";

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
            {group.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              group.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-display font-semibold">{group.name}</h2>
            <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-10 top-full mt-1 glass rounded-xl shadow-elevated py-1 min-w-40 animate-fade-in">
              {canManage && (
                <Link
                  href={`/groups/${group.id}/settings`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Group settings
                </Link>
              )}
              <button
                onClick={() => { setConfirmLeave(true); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Leave group
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => { onLeave(); setConfirmLeave(false); }}
        title="Leave group?"
        description={`You will no longer be a member of "${group.name}".`}
        confirmLabel="Leave"
        variant="destructive"
        loading={isLeaving}
      />
    </>
  );
}
