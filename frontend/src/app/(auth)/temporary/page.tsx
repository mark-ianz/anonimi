"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";

export default function TemporaryAccountPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const createTemp = async () => {
      try {
        const res = await api.post("/auth/temporary");
        const { accessToken, refreshToken, user } = res.data.data as {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        };
        setAuth(user, accessToken, refreshToken);
        router.replace("/chat");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Failed to create a temporary account.";
        if (mounted) {
          setError(msg);
        }
        toast.error(msg);
      }
    };

    void createTemp();

    return () => {
      mounted = false;
    };
  }, [router, setAuth]);

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8">
      <div className="space-y-3">
        <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Temporary Access
        </p>
        <h1 className="text-2xl font-semibold">Creating your temporary account...</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ll be signed in automatically. This session expires in 24 hours unless you claim it.
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
