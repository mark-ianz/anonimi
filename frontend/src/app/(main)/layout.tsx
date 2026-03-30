"use client";

import { useState } from "react";
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
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers/SocketProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function MainLayout({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse-soft" />
              <span className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">Online</span>
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
