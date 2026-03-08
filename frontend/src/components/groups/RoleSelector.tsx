"use client";

import { cn } from "@/lib/utils";
import type { GroupRole } from "@/types/group";

interface RoleSelectorProps {
  value: GroupRole;
  onChange: (role: GroupRole) => void;
  exclude?: GroupRole[];
  className?: string;
}

const roles: { value: GroupRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Can manage members and settings" },
  { value: "member", label: "Member", description: "Regular group member" },
];

export default function RoleSelector({ value, onChange, exclude = [], className }: RoleSelectorProps) {
  const available = roles.filter((r) => !exclude.includes(r.value));

  return (
    <div className={cn("flex gap-2", className)}>
      {available.map((role) => (
        <button
          key={role.value}
          onClick={() => onChange(role.value)}
          className={cn(
            "flex-1 px-3 py-2 rounded-xl border text-left transition-colors",
            value === role.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 hover:bg-muted/50"
          )}
        >
          <p className="text-sm font-medium">{role.label}</p>
          <p className="text-xs text-muted-foreground">{role.description}</p>
        </button>
      ))}
    </div>
  );
}
