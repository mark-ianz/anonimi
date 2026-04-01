"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flag,
  LifeBuoy,
  Users2,
  MessageSquare,
  Ban,
  BarChart2,
  ScrollText,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["moderator", "super_admin"] },
  { href: "/admin/reports", label: "Reports", icon: Flag, roles: ["moderator", "super_admin"] },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/groups", label: "Groups", icon: Users2, roles: ["moderator", "super_admin"] },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, roles: ["moderator", "super_admin"] },
  { href: "/admin/bans", label: "Bans", icon: Ban, roles: ["moderator", "super_admin"] },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/logs", label: "Logs", icon: ScrollText, roles: ["super_admin"] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const visible = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="h-full w-60 shrink-0 border-r border-border/60 bg-card/45 flex flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border/50 px-4 shrink-0">
        <div className="grid h-7 w-7 place-items-center rounded-lg border border-border/70 bg-background">
          <span className="font-display text-xs font-semibold">E</span>
        </div>
        <div>
          <p className="text-sm font-semibold">anonimi</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground leading-none">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                isActive
                  ? "bg-primary/12 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3 shrink-0">
        <div className="flex items-center gap-2.5 mb-2">
          {user?.profileImage ? (
            <img
              src={`${API_BASE.replace("/api", "")}${user.profileImage}`}
              alt={user.username}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.username}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 h-8 px-3 rounded-lg font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
