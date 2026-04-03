"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flag,
  LifeBuoy,
  AlertTriangle,
  Users2,
  MessageSquare,
  Ban,
  BarChart2,
  ScrollText,
  ClipboardCheck,
  LogOut,
  MessageCircle,
  Mail,
  MessageCircleMore,
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

interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_ROLES = ["support_staff", "moderator", "super_admin"];
const MOD_ROLES = ["moderator", "super_admin"];

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ADMIN_ROLES },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2, roles: MOD_ROLES },
    ],
  },
  {
    title: "Users & Content",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, roles: ADMIN_ROLES },
      { href: "/admin/groups", label: "Groups", icon: Users2, roles: MOD_ROLES },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare, roles: MOD_ROLES },
    ],
  },
  {
    title: "Support & Moderation",
    items: [
      { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy, roles: ADMIN_ROLES },
      { href: "/admin/contact-messages", label: "Contact Messages", icon: Mail, roles: ADMIN_ROLES },
      { href: "/admin/reports", label: "Reports", icon: Flag, roles: ADMIN_ROLES },
      { href: "/admin/warnings", label: "Warnings", icon: AlertTriangle, roles: ADMIN_ROLES },
      { href: "/admin/bans", label: "Bans", icon: Ban, roles: MOD_ROLES },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["super_admin"] },
      { href: "/admin/logs", label: "Logs", icon: ScrollText, roles: MOD_ROLES },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (user?.role && item.roles.includes(user.role))
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="h-full w-60 shrink-0 border-r border-border/60 bg-card/45 flex flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border/50 px-4 shrink-0">
        <div className="grid h-7 w-7 place-items-center rounded-lg border border-border/70 bg-background">
          <Image
            src="/images/icon/anonimi-logo-no-bg.png"
            alt="anonimi"
            width={18}
            height={18}
            className="h-4 w-4"
          />
        </div>
        <div>
          <p className="font-logo text-sm font-semibold">anonimi</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground leading-none">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-3")}> 
            <p className="px-3 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
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
            </div>
          </div>
        ))}
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
        <Link
          href="/chat"
          className="mb-2 flex items-center gap-2 h-8 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Back to Chat
        </Link>
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
