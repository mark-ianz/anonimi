"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageCircle, 
  Users, 
  UserCircle2, 
  Settings, 
  HelpCircle,
  Menu,
  Search,
  Bell,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers/SocketProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { getChatSocket } from "@/lib/socket";
import type { AppearanceStatus, OnlineStatus } from "@/types/user";

const navItems = [
  { href: "/chat", icon: MessageCircle, label: "Chats" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/profile", icon: UserCircle2, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const bottomNavItems = [
  { href: "/support", icon: HelpCircle, label: "Support" },
];

interface SidebarProps {
  children: React.ReactNode;
}

const appearanceOptions: {
  value: AppearanceStatus;
  label: string;
  dotClass: string;
}[] = [
  { value: "online", label: "Online", dotClass: "bg-green-500" },
  { value: "away", label: "Away", dotClass: "bg-yellow-500" },
  { value: "dnd", label: "Do Not Disturb", dotClass: "bg-red-500" },
  { value: "invisible", label: "Invisible", dotClass: "bg-muted-foreground/45" },
];

export default function MainLayout({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const { updateProfile, isUpdatingProfile } = useAuth();
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const currentStatus = (user?.onlineStatus ?? "offline") as OnlineStatus;
  const currentAppearance = (user?.appearanceStatus ?? "online") as AppearanceStatus;

  const appearanceLabelMap: Record<AppearanceStatus, string> = {
    online: "Online",
    away: "Away",
    dnd: "Do Not Disturb",
    invisible: "Invisible",
  };

  const statusDotMap: Record<OnlineStatus, string> = {
    online: "bg-green-500 animate-pulse-soft",
    away: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-muted-foreground/45",
  };

  useEffect(() => {
    if (!statusMenuOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [statusMenuOpen]);

  const handleStatusSelect = (status: AppearanceStatus) => {
    if (!user || status === user.appearanceStatus) {
      setStatusMenuOpen(false);
      return;
    }

    updateProfile({ appearanceStatus: status });
    getChatSocket().emit("presence:set-status", { status });
    setStatusMenuOpen(false);
  };

  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden bg-background">
      <aside 
        className={cn(
          "flex flex-col border-r border-border/60 bg-card/45 transition-all duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <TooltipProvider>
        <div className={cn(
          "flex items-center gap-3 border-b border-border/50 px-4 py-4",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 bg-background">
            <span className="font-display text-base font-semibold">E</span>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold tracking-[0.01em]">
              EchoID
            </span>
          )}
        </div>

        {!isCollapsed && (
          <div className="px-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/chat" && pathname.startsWith(item.href));
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive 
                    ? "bg-primary/12 text-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform",
                  !isActive && "group-hover:scale-110"
                )} />
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>
                )}
              </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border/50 px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive 
                    ? "bg-primary/12 text-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>
                )}
              </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
              className="flex h-11 items-center justify-center border-t border-border/50 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={isCollapsed ? "right" : "top"} sideOffset={10}>
            {isCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
        </TooltipProvider>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background/75 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 transition-colors hover:bg-muted">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setStatusMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 transition-colors hover:bg-card"
                aria-label="Change visibility status"
              >
                <div className={cn("h-2 w-2 rounded-full", statusDotMap[currentStatus])} />
                <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {appearanceLabelMap[currentAppearance]}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    statusMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 min-w-48 rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-elevated backdrop-blur-sm">
                  {appearanceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      disabled={isUpdatingProfile}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
                        currentAppearance === option.value && "bg-primary/10"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", option.dotClass)} />
                        <span className="text-foreground">{option.label}</span>
                      </span>
                      {currentAppearance === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-medium text-foreground">
              U
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
    </SocketProvider>
  );
}
