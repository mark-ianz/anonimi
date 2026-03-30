"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";
import {
  clearPendingVerification,
  getPendingVerification,
  savePendingVerification,
  type VerificationType,
} from "@/lib/verification";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const rawTarget = searchParams.get("target") ?? "";
  const rawType = searchParams.get("type") ?? "email";
  const type: VerificationType = rawType === "phone" ? "phone" : "email";
  const target = type === "email" ? rawTarget.trim().toLowerCase() : rawTarget.trim();
  const targetLabel = type === "phone" ? "phone" : "email";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isCheckingContext, setIsCheckingContext] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let mounted = true;

    const redirectToRegister = (message: string) => {
      if (!mounted) return;
      toast.error(message, { duration: 4500 });
      router.replace("/register");
    };

    const validateContext = async () => {
      const isValidType = rawType === "email" || rawType === "phone";
      if (!target || !isValidType) {
        clearPendingVerification();
        redirectToRegister("Verification link is missing required details.");
        return;
      }

      savePendingVerification({ target, type });

      try {
        const res = await api.get("/auth/verification-status", {
          params: { target, type },
        });

        if (!mounted) return;

        if (!res.data?.data?.canVerify) {
          clearPendingVerification();
          redirectToRegister("This verification session is no longer valid. Please register or sign in again.");
          return;
        }

        setIsCheckingContext(false);
      } catch {
        if (!mounted) return;

        const pending = getPendingVerification();
        if (
          pending &&
          pending.target === target &&
          pending.type === type
        ) {
          setIsCheckingContext(false);
          return;
        }

        clearPendingVerification();
        redirectToRegister("Unable to validate your verification session. Please try again.");
      }
    };

    void validateContext();

    return () => {
      mounted = false;
    };
  }, [rawType, router, target, type]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const submit = async () => {
    if (isCheckingContext) return;

    const fullCode = code.join("");
    if (fullCode.length < 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint = type === "email" ? "/auth/verify-email" : "/auth/verify-phone";
      const body = type === "email" ? { email: target, code: fullCode } : { phone: target, code: fullCode };
      const res = await api.post(endpoint, body);
      const { accessToken, refreshToken, user } = res.data.data as {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      };
      setAuth(user, accessToken, refreshToken);
      clearPendingVerification();
      toast.success("Account verified! Welcome to EchoID.");
      router.push("/chat");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Invalid verification code.";
      toast.error(msg);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (code.every((c) => c !== "") && !isSubmitting && !isCheckingContext) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isCheckingContext, isSubmitting]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (isCheckingContext || isResending || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await api.post("/auth/resend-verification", { target, type });
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      setResendCooldown(30);
      toast.success(`A new verification code was sent to your ${targetLabel}.`, {
        duration: 5000,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        "Unable to resend verification code right now.";
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsResending(false);
    }
  };

  if (isCheckingContext) {
    return <div className="glass rounded-2xl p-8 shadow-elevated animate-pulse h-64" />;
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-elevated">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-4 bg-primary/10">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Verify your {targetLabel}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 text-center">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{target}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-13 text-center text-xl font-semibold rounded-xl bg-muted/50 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all caret-transparent"
          />
        ))}
      </div>

      <button
        onClick={submit}
        disabled={isSubmitting || isCheckingContext || code.some((c) => !c)}
        className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        style={{ background: "var(--echo-gradient)" }}
      >
        {isSubmitting ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          "Verify"
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || isCheckingContext || resendCooldown > 0}
          className="text-primary font-medium hover:underline disabled:no-underline disabled:opacity-60"
        >
          {isResending
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend"}
        </button>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="glass rounded-2xl p-8 shadow-elevated animate-pulse h-64" />}>
      <VerifyForm />
    </Suspense>
  );
}
