"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceiptProps {
  readBy: string[];
  participantCount: number;
  className?: string;
}

export default function ReadReceipt({ readBy, participantCount, className }: ReadReceiptProps) {
  const allRead = readBy.length >= participantCount - 1;

  return (
    <span className={cn("flex items-center", className)}>
      {allRead ? (
        <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
      ) : readBy.length > 0 ? (
        <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/40" />
      ) : (
        <Check className="w-3.5 h-3.5 text-primary-foreground/40" />
      )}
    </span>
  );
}
