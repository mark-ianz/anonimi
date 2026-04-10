"use client";

import { Check, X, UserCircle2 } from "lucide-react";
import Link from "next/link";
import type { ContactRequest } from "@/types/contact";
import DateDisplay from "@/components/shared/DateDisplay";
import UserAvatar from "@/components/shared/UserAvatar";

interface ContactRequestCardProps {
  request: ContactRequest;
  onAccept: (contactId: string) => void;
  onDecline: (contactId: string) => void;
}

export default function ContactRequestCard({
  request,
  onAccept,
  onDecline,
}: ContactRequestCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20 animate-fade-in">
      {/* Avatar */}
      <UserAvatar
        imageUrl={request.from.profileImage}
        name={request.from.username}
        className="w-11 h-11"
        roundedClassName="rounded-xl"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/user/${request.from.anonimiId}`} className="text-sm font-medium hover:underline truncate block">
          {request.from.username}
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">@{request.from.anonimiId}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <DateDisplay date={request.createdAt} format="relative" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onAccept(request.requestId)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Accept
        </button>
        <button
          onClick={() => onDecline(request.requestId)}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-border/50 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
