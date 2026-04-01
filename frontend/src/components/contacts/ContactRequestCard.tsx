"use client";

import { Check, X, UserCircle2 } from "lucide-react";
import Link from "next/link";
import type { ContactRequest } from "@/types/contact";
import DateDisplay from "@/components/shared/DateDisplay";
import { resolveMediaUrl } from "@/lib/mediaUrl";

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
      <div className="w-11 h-11 rounded-xl overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
        {request.from.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveMediaUrl(request.from.profileImage)} alt={request.from.username} className="w-full h-full object-cover" />
        ) : (
          request.from.username[0].toUpperCase()
        )}
      </div>

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
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Accept
        </button>
        <button
          onClick={() => onDecline(request.requestId)}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-border/50 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
