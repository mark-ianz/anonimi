"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import DateDisplay from "@/components/shared/DateDisplay";

interface ReadReceiptProps {
  readBy: string[];
  readAt?: string | null;
  readByAt?: Record<string, string>;
  participantCount: number;
  conversationType: "private" | "group";
  currentUserId?: string;
  readByUsersById?: Record<string, { name?: string; anonimiId?: string }>;
  className?: string;
}

export default function ReadReceipt({
  readBy,
  readAt,
  readByAt,
  participantCount,
  conversationType,
  currentUserId,
  readByUsersById,
  className,
}: ReadReceiptProps) {
  const [isReadersModalOpen, setIsReadersModalOpen] = useState(false);
  const readersExcludingSender = currentUserId
    ? readBy.filter((readerId) => readerId !== currentUserId)
    : readBy;
  const allRead = readersExcludingSender.length >= participantCount - 1;
  const readBySome = readersExcludingSender.length > 0;

  const readers = useMemo(
    () =>
      readersExcludingSender.map((readerId) => ({
        id: readerId,
        name: readByUsersById?.[readerId]?.name ?? `${readerId.slice(0, 8)}...`,
        anonimiId: readByUsersById?.[readerId]?.anonimiId ?? null,
        readAt: readByAt?.[readerId] ?? null,
      })),
    [readByAt, readByUsersById, readersExcludingSender]
  );

  if (conversationType === "private") {
    return (
      <span className={cn("text-[11px] font-medium text-muted-foreground", className)}>
        {readBySome ? (
          <>
            Read
            {readAt && (
              <>
                {" "}at <DateDisplay date={readAt} format="time" className="inline text-[11px] font-medium text-muted-foreground" />
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

  const isSomeReadState = readBySome && !allRead;

  return (
    <>
      <span className={cn("relative inline-flex items-center", className)}>
        {isSomeReadState ? (
          <button
            type="button"
            onClick={() => setIsReadersModalOpen(true)}
            className="text-[11px] font-medium text-muted-foreground transition-colors hover:underline"
          >
            {label}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        )}
      </span>

      {isReadersModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-120 flex items-center justify-center p-4"
          onClick={() => setIsReadersModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-elevated"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Read by some</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Seen by {readers.length} {readers.length === 1 ? "member" : "members"}
            </p>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-1 pr-1">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className="rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                >
                  {reader.anonimiId ? (
                    <Link
                      href={`/user/${reader.anonimiId}`}
                      onClick={() => setIsReadersModalOpen(false)}
                      className="text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {reader.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{reader.name}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {reader.readAt ? (
                      <>
                        Read at <DateDisplay date={reader.readAt} format="time" className="inline text-[11px] text-muted-foreground" />
                      </>
                    ) : (
                      "Read time unavailable"
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsReadersModalOpen(false)}
                className="h-9 rounded-lg border border-border/70 px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
