"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  MessageCircle, 
  Users, 
  UserCircle2, 
  Settings, 
  HelpCircle,
  ShieldCheck,
  Menu,
  Search,
  Bell,
  Check,
  ChevronDown,
  Clock3,
  ShieldAlert,
  UserPlus2,
  MessagesSquare,
  Archive,
  LifeBuoy,
  BellDot,
  Trash2,
  X,
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
import { useTempCountdown } from "@/hooks/useTempCountdown";
import { getChatSocket } from "@/lib/socket";
import type { AppearanceStatus, OnlineStatus } from "@/types/user";
import { useNotifications } from "@/hooks/useNotifications";
import { useContacts } from "@/hooks/useContacts";
import { useChatStore } from "@/stores/chatStore";
import TemporaryAccountBadge from "@/components/shared/TemporaryAccountBadge";
import UserAvatar from "@/components/shared/UserAvatar";

const navItems = [
  { href: "/chat", icon: MessageCircle, label: "Chats" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/archive", icon: Archive, label: "Archive" },
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
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const { user } = useAuthStore();
  const { remainingLabel: tempRemaining } = useTempCountdown(user?.tempExpiresAt ?? null);
  const isTempUser = !!user?.isTemporary;
  const { conversations, unreadCounts } = useChatStore();
  const { requests } = useContacts();
  const { updateProfile, isUpdatingProfile } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    markRead,
    deleteNotification,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications();
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const isSidebarCompact = isCollapsed && !isMobileSidebarOpen;

  const unreadChatCount = useMemo(() => {
    return conversations.reduce((total, conversation) => {
      const unread = unreadCounts[conversation.id] ?? conversation.unreadCount ?? 0;
      return total + unread;
    }, 0);
  }, [conversations, unreadCounts]);

  const contactRequestCount = requests.length;
  const supportUnreadCount = useMemo(() => {
    return notifications.filter((n) => {
      if (n.read) return false;
      const type = n.type.toLowerCase();
      return type.includes("warning") || type.includes("ticket") || type.includes("support") || type.includes("report");
    }).length;
  }, [notifications]);

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
    if (!statusMenuOpen && !notificationMenuOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notificationMenuOpen, statusMenuOpen]);

  const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString();
  };

  const getNotificationMeta = (type: string) => {
    const normalized = type.toLowerCase();

    if (normalized.includes("warning")) {
      return {
        label: "Warning",
        chipClass: "bg-destructive/15 text-destructive",
        dotClass: "bg-destructive",
        Icon: ShieldAlert,
      };
    }

    if (normalized.includes("admin") || normalized.includes("report")) {
      return {
        label: "Moderation",
        chipClass: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
        dotClass: "bg-amber-500",
        Icon: ShieldAlert,
      };
    }

    if (normalized.includes("contact") || normalized.includes("request")) {
      return {
        label: "Request",
        chipClass: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
        dotClass: "bg-sky-500",
        Icon: UserPlus2,
      };
    }

    if (normalized.includes("message") || normalized.includes("chat")) {
      return {
        label: "Message",
        chipClass: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        dotClass: "bg-emerald-500",
        Icon: MessagesSquare,
      };
    }

    if (normalized.includes("support") || normalized.includes("ticket")) {
      return {
        label: "Support",
        chipClass: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
        dotClass: "bg-violet-500",
        Icon: LifeBuoy,
      };
    }

    return {
      label: "Update",
      chipClass: "bg-primary/12 text-primary",
      dotClass: "bg-primary",
      Icon: BellDot,
    };
  };

  const resolveNotificationHref = (data: Record<string, unknown>) => {
    const href = data.href;
    if (typeof href !== "string") return "/chat";
    if (href === "/contacts/requests") return "/contacts?tab=requests";
    return href;
  };

  const handleStatusSelect = (status: AppearanceStatus) => {
    if (!user || status === user.appearanceStatus) {
      setStatusMenuOpen(false);
      return;
    }

    updateProfile({ appearanceStatus: status });
    getChatSocket().emit("presence:set-status", { status });
    setStatusMenuOpen(false);
  };

  const handleSidebarSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = sidebarSearch.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setIsMobileSearchOpen(false);
  };

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <SocketProvider>
      <div className="flex h-screen overflow-hidden bg-background">
      <aside 
        className={cn(
          "fixed inset-0 z-40 flex w-full flex-col border-r border-border/60 bg-card/95 transition-all duration-300 ease-out md:relative md:z-auto md:inset-auto md:bg-card/45",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <TooltipProvider>
        <div className={cn(
          "flex items-center gap-3 border-b border-border/50 px-4 py-4",
          isSidebarCompact && "justify-center px-2"
        )}>
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 bg-background">
            <Image
              src="/images/icon/anonimi-logo-no-bg.png"
              alt="anonimi"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </div>
          {!isSidebarCompact && (
            <span className="font-logo text-lg font-semibold">
              anonimi
            </span>
          )}
          {!isSidebarCompact && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close menu"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isSidebarCompact && (
          <div className="px-3 py-3">
            <div className="rounded-xl border border-border/60 bg-background/70 p-3">
              <div ref={statusMenuRef}>
                <div className="flex items-center gap-3 md:items-start">
                  <UserAvatar
                    imageUrl={user?.profileImage}
                    name={user?.username ?? user?.anonimiId ?? "User"}
                    alt={user?.username ?? user?.anonimiId ?? "User"}
                    className="h-10 w-10"
                    textClassName="text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user?.username ?? user?.anonimiId ?? "Anonimi User"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCircle2 className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {user?.anonimiId ? `@${user.anonimiId}` : "@aid_xxxxxx"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto self-center md:ml-0">
                    <div className="relative md:hidden">
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
                        <div className="absolute left-0 top-full z-40 mt-2 min-w-48 rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-elevated backdrop-blur-sm">
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
                  </div>
                </div>

                <div className="relative mt-3 hidden md:block">
                <button
                  onClick={() => setStatusMenuOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 transition-colors hover:bg-card"
                  aria-label="Change visibility status"
                >
                  <span className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", statusDotMap[currentStatus])} />
                    <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {appearanceLabelMap[currentAppearance]}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      statusMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                  {statusMenuOpen && (
                    <div className="absolute left-0 top-full z-40 mt-2 w-full min-w-48 rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-elevated backdrop-blur-sm">
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
              </div>
            </div>
          </div>
        )}

        <nav className={cn("flex-1 space-y-1 overflow-y-auto px-2 py-2", isSidebarCompact && "pt-3")}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/chat" && pathname.startsWith(item.href));
            const badgeCount =
              item.href === "/chat"
                ? unreadChatCount
                : item.href === "/contacts"
                ? contactRequestCount
                : 0;
            const showBadge = badgeCount > 0;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                  !isCollapsed && showBadge && "pr-2",
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
                {isSidebarCompact && showBadge && (
                  <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-primary px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-primary-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
                {!isSidebarCompact && (
                  <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>
                )}
                {!isSidebarCompact && showBadge && (
                  <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-primary-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
                </TooltipTrigger>
                {isSidebarCompact && (
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
            const badgeCount = item.href === "/support" ? supportUnreadCount : 0;
            const showBadge = badgeCount > 0;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive 
                    ? "bg-primary/12 text-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isSidebarCompact && (
                  <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>
                )}
                {!isSidebarCompact && showBadge && (
                  <span className="ml-auto min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-destructive-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
                {isSidebarCompact && showBadge && (
                  <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-destructive px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-destructive-foreground">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
                </TooltipTrigger>
                {isSidebarCompact && (
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
          {user?.role && ["super_admin", "moderator", "support_staff"].includes(user.role) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin"
                  aria-label="Admin"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 transition-all duration-200",
                    pathname.startsWith("/admin")
                      ? "bg-primary/12 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  {!isSidebarCompact && (
                    <span className="truncate whitespace-nowrap text-sm font-medium">Admin</span>
                  )}
                </Link>
              </TooltipTrigger>
              {isSidebarCompact && (
                <TooltipContent side="right" sideOffset={10}>
                  Admin
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
              className="hidden h-11 items-center justify-center border-t border-border/50 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:flex"
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
        <header className="relative z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/75 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative z-50" ref={notificationMenuRef}>
              <button
                onClick={() => setNotificationMenuOpen((prev) => !prev)}
                className="relative rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-destructive px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,24rem)] rounded-xl border border-border/70 bg-card/95 p-2 shadow-elevated backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-border/60 px-2 pb-2">
                    <p className="text-sm font-semibold">Notifications</p>
                    <button
                      onClick={() => markAllRead()}
                      disabled={isMarkingAllRead || unreadCount === 0}
                      className="text-xs font-medium text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="notification-scrollbar max-h-96 overflow-y-auto py-1 pr-1">
                    {isLoadingNotifications ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
                    ) : (
                      notifications.slice(0, 20).map((notification) => {
                        const meta = getNotificationMeta(notification.type);

                        return (
                          <Link
                            key={notification.id}
                            href={resolveNotificationHref(notification.data)}
                            onClick={() => {
                              if (!notification.read) {
                                markRead(notification.id);
                              }
                              setNotificationMenuOpen(false);
                            }}
                            className={cn(
                              "group block rounded-lg border border-transparent px-2 py-2.5 transition-colors hover:bg-muted",
                              !notification.read && "bg-primary/8 border-primary/20"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]", meta.chipClass)}>
                                    <meta.Icon className="h-3 w-3" />
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="truncate text-sm font-medium text-foreground">
                                  {notification.title}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                  {notification.body}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Clock3 className="h-3 w-3" />
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.read && (
                                <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", meta.dotClass)} />
                              )}

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                aria-label="Delete notification"
                                title="Delete notification"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={handleSidebarSearchSubmit}
              className="relative hidden min-w-[18rem] max-w-[28rem] flex-1 md:flex"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search everything..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-10 text-sm placeholder:text-muted-foreground transition-all focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted md:hidden"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isTempUser && tempRemaining && (
              <Link
                href="/profile"
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
              >
                <TemporaryAccountBadge className="bg-transparent px-0 py-0 text-[9px]" />
                <span>Expires in {tempRemaining}</span>
              </Link>
            )}
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-medium text-foreground">
              U
            </button>
          </div>
        </header>

        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur-sm md:hidden">
            <div className="flex items-center justify-between gap-3">
              <form onSubmit={handleSidebarSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search everything..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  autoFocus
                  className="h-11 w-full rounded-lg border border-border/60 bg-background pl-10 pr-10 text-base placeholder:text-muted-foreground transition-all focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close search"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
    </SocketProvider>
  );
}
