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
    <aside className="w-60 h-full flex flex-col border-r border-border/30 bg-background/80 backdrop-blur-sm shrink-0">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/30 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">E</span>
        </div>
        <div>
          <p className="text-sm font-bold font-display">EchoID</p>
          <p className="text-[10px] text-muted-foreground leading-none">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 h-9 px-3 rounded-xl text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-border/30 shrink-0">
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
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
