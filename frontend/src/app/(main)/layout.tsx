"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageCircle, 
  Users, 
  UserCircle2, 
  Settings, 
  Shield,
  HelpCircle,
  Menu,
  Search,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers/SocketProvider";

const navItems = [
  { href: "/chat", icon: MessageCircle, label: "Chats" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/profile", icon: UserCircle2, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const bottomNavItems = [
  { href: "/support", icon: HelpCircle, label: "Support" },
  { href: "/admin", icon: Shield, label: "Admin" },
];

interface SidebarProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SocketProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border/50 transition-all duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-border/30",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.15_250)] to-[oklch(0.45_0.12_300)] flex items-center justify-center shadow-md">
            <span className="text-white font-display font-bold text-lg">E</span>
          </div>
          {!isCollapsed && (
            <span className="font-display font-semibold text-xl tracking-tight">
              EchoID
            </span>
          )}
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/50 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
        )}

        {/* Main Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/chat" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-transform",
                  !isActive && "group-hover:scale-110"
                )} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div className="px-2 py-2 border-t border-border/30 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center h-12 border-t border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
              <span className="text-xs font-medium text-muted-foreground">Online</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-sm font-medium">
              U
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
    </SocketProvider>
  );
}
