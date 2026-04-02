"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  clearPendingVerification,
  getPendingVerification,
  savePendingVerification,
} from "@/lib/verification";

const schema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, _ and ."
      )
      .optional()
      .or(z.literal("")),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingResume, setIsCheckingResume] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resumeVerificationIfNeeded = async () => {
      const pending = getPendingVerification();
      if (!pending) {
        if (mounted) setIsCheckingResume(false);
        return;
      }

      try {
        const res = await api.get("/auth/verification-status", {
          params: { target: pending.target, type: pending.type },
        });

        if (!mounted) return;

        const verification = res.data?.data as
          | {
              canVerify?: boolean;
              reason?: string;
            }
          | undefined;

        if (
          verification?.canVerify ||
          verification?.reason === "code_expired" ||
          verification?.reason === "no_code"
        ) {
          router.replace(
            `/verify?target=${encodeURIComponent(pending.target)}&type=${pending.type}`
          );
          return;
        }

        clearPendingVerification();
        setIsCheckingResume(false);
      } catch {
        if (!mounted) return;
        clearPendingVerification();
        setIsCheckingResume(false);
      }
    };

    void resumeVerificationIfNeeded();

    return () => {
      mounted = false;
    };
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (isCheckingResume) {
    return <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8 h-155 animate-pulse" />;
  }

  const onSubmit = async (data: FormData) => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const payload: Record<string, string> = {
        email: normalizedEmail,
        password: data.password,
      };

      const username = (data.username ?? "").trim();
      if (username) payload.username = username;

      await api.post("/auth/register", payload);
      savePendingVerification({ type: "email", target: normalizedEmail });
      toast.success("Account created! Check your inbox for the verification code.");
      router.push(`/verify?target=${encodeURIComponent(normalizedEmail)}&type=email`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Registration failed. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8">
      <div className="mb-8">
        <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Create Account
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go to landing page"
            className="grid h-11 w-11 place-items-center rounded-xl border border-border/70 bg-background transition hover:border-border"
          >
            <span className="font-display text-lg font-semibold">E</span>
          </Link>
          <div>
            <h1 className="text-3xl leading-[0.98] font-semibold">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join anonimi today</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Username</label>
          <input
            {...register("username")}
            type="text"
            autoComplete="username"
            placeholder="Optional (auto-generated if empty)"
            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            For better anonymity, avoid using your real name as username.
          </p>
          {errors.username && (
            <p className="text-destructive text-xs mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Confirm password</label>
          <input
            {...register("confirmPassword")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create account
            </>
          )}
        </button>

        <div className="text-center text-sm text-muted-foreground">
          Want a short session?{" "}
          <button
            type="button"
            onClick={() => router.push("/temporary")}
            className="font-semibold text-amber-700 hover:underline"
          >
            Continue as temporary
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
