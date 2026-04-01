"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";
import { clearPendingVerification, savePendingVerification } from "@/lib/verification";

export default function VerifyLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    const token = searchParams.get("token") ?? "";
    const email = (searchParams.get("email") ?? "").trim().toLowerCase();

    if (!token) {
      setStatus("error");
      toast.error("Verification link is missing or invalid.");
      return;
    }

    if (email) {
      savePendingVerification({ type: "email", target: email });
    }

    const verify = async () => {
      try {
        const res = await api.get("/auth/verify-email-link", {
          params: { token },
        });

        if (!mounted) return;

        const { accessToken, refreshToken, user } = res.data.data as {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        };

        setAuth(user, accessToken, refreshToken);
        clearPendingVerification();
        toast.success("Account verified! Welcome to EchoID.");
        router.replace("/chat");
      } catch (err: unknown) {
        if (!mounted) return;

        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ??
          "This verification link is invalid or expired.";

        setStatus("error");
        toast.error(msg, { duration: 5000 });
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, [router, searchParams, setAuth]);

  if (status === "error") {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8 text-center">
        <h1 className="text-2xl font-semibold">Verification failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please request a new verification code and try again.
        </p>
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="mt-6 h-10 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Go to register
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <h1 className="text-2xl font-semibold">Verifying your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please wait while we finish verifying your account.
      </p>
    </div>
  );
}
