"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";
import { sanitizeAuthRedirect } from "@/lib/authRedirect";

export default function TemporaryAccountPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/chat");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTarget(sanitizeAuthRedirect(params.get("redirect")));
  }, []);

  const handleStartTemporary = async () => {
    if (isCreating) return;
    setError(null);
    setIsCreating(true);
    try {
      const res = await api.post("/auth/temporary");
      const { accessToken, refreshToken, user } = res.data.data as {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      };
      setAuth(user, accessToken, refreshToken);
      router.replace(redirectTarget);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to create a temporary account.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8">
      <div className="space-y-4">
        <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Temporary Access
        </p>
        <h1 className="text-2xl font-semibold">Try anonimi without committing.</h1>
        <p className="text-sm text-muted-foreground">
          Temporary sessions are built for quick starts. You can jump into a chat, explore the product,
          and decide later if you want to keep the account.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold text-foreground">How it works</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Start a 24-hour session</li>
              <li>Chat and explore features</li>
              <li>Claim your account anytime</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-xs font-semibold text-foreground">Best for</p>
            <p className="mt-2 text-xs text-muted-foreground">
              First-time conversations, quick demos, and low-commitment trials.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold text-foreground">Things to know</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>Session expires after 24 hours</li>
            <li>Claim to keep your conversations</li>
            <li>Some actions are limited until claimed</li>
          </ul>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleStartTemporary}
            disabled={isCreating}
            className="flex flex-1 items-center justify-center rounded-xl bg-amber-600 text-sm font-semibold text-white transition-colors hover:bg-amber-600/90 disabled:opacity-60 py-3 md:py-4 cursor-pointer"
          >
            {isCreating ? "Starting..." : "Start temporary session"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/register?redirect=${encodeURIComponent(redirectTarget)}`)}
            className="flex flex-1 items-center justify-center rounded-xl border border-border/70 text-sm font-semibold text-foreground hover:bg-muted transition-colors py-3 md:py-4 cursor-pointer"
          >
            Create full account
          </button>
        </div>
      </div>
    </div>
  );
}
