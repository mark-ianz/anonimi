"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const target = searchParams.get("target") ?? "";
  const type = (searchParams.get("type") ?? "email") as "email" | "phone";
  const targetLabel = type === "phone" ? "phone" : "email";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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
    if (code.every((c) => c !== "") && !isSubmitting) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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
        disabled={isSubmitting || code.some((c) => !c)}
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
        <button className="text-primary font-medium hover:underline">
          Resend
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
