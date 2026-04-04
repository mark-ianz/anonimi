"use client";

import Link from "next/link";
import { Clock3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: Record<string, unknown>;
}

interface NotificationMeta {
  label: string;
  chipClass: string;
  dotClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface NotificationPanelContentProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  isMarkingAllRead: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  getNotificationMeta: (type: string) => NotificationMeta;
  resolveNotificationHref: (data: Record<string, unknown>) => string;
  formatNotificationTime: (date: string) => string;
  onClose: () => void;
}

export default function NotificationPanelContent({
  notifications,
  unreadCount,
  isLoadingNotifications,
  isMarkingAllRead,
  markRead,
  markAllRead,
  deleteNotification,
  getNotificationMeta,
  resolveNotificationHref,
  formatNotificationTime,
  onClose,
}: NotificationPanelContentProps) {
  return (
    <>
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

      <ScrollArea className="max-h-[min(60vh,24rem)] pr-1">
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
                  onClose();
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
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-100 md:opacity-0 transition-opacity hover:bg-muted hover:text-foreground md:group-hover:opacity-100"
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
      </ScrollArea>
    </>
  );
}
