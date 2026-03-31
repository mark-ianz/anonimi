"use client";

import { cn } from "@/lib/utils";
import DateDisplay from "@/components/shared/DateDisplay";

interface ReadReceiptProps {
  readBy: string[];
  readAt?: string | null;
  participantCount: number;
  conversationType: "private" | "group";
  currentUserId?: string;
  className?: string;
}

export default function ReadReceipt({
  readBy,
  readAt,
  participantCount,
  conversationType,
  currentUserId,
  className,
}: ReadReceiptProps) {
  const readersExcludingSender = currentUserId
    ? readBy.filter((readerId) => readerId !== currentUserId)
    : readBy;
  const allRead = readersExcludingSender.length >= participantCount - 1;
  const readBySome = readersExcludingSender.length > 0;

  if (conversationType === "private") {
    return (
      <span className={cn("text-[11px] font-medium text-primary-foreground/70", className)}>
        {readBySome ? (
          <>
            Read
            {readAt && (
              <>
                {" "}at <DateDisplay date={readAt} format="time" className="inline text-[11px] font-medium text-primary-foreground/70" />
              </>
            )}
          </>
        ) : (
          "Sent"
        )}
      </span>
    );
  }

  const label = allRead
    ? "Read by everyone"
    : readBySome
    ? `Read by some (${readersExcludingSender.length})`
    : "Sent";

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span className="text-[11px] font-medium text-primary-foreground/70">{label}</span>

      {readBySome && (
        <span className="pointer-events-none absolute -top-2 right-0 hidden w-max max-w-52 -translate-y-full rounded-md border border-border/60 bg-background/95 px-2 py-1 text-[10px] text-foreground shadow-soft group-hover:block">
          <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Read by</span>
          {readersExcludingSender.map((readerId) => (
            <span key={readerId} className="block">
              {readerId.slice(0, 8)}...
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
