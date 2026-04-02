"use client";

import Link from "next/link";

interface TemporaryAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TemporaryAccountModal({ open, onClose }: TemporaryAccountModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border/70 bg-card p-5 shadow-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-semibold">Temporary account limitation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This feature requires a claimed account. Verify your email and set a password to unlock full access.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border/70 text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
          <Link
            href="/profile"
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:bg-primary/90 transition-colors"
            onClick={onClose}
          >
            Claim account
          </Link>
        </div>
      </div>
    </div>
  );
}
