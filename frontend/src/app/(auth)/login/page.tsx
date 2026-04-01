"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types/user";
import {
  clearPendingVerification,
  savePendingVerification,
  type VerificationType,
} from "@/lib/verification";

const schema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    type: VerificationType;
    target: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    setPendingVerification(null);

    try {
      const res = await api.post("/auth/login", data);
      const { accessToken, refreshToken, user } = res.data.data as {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      };
      setAuth(user, accessToken, refreshToken);
      clearPendingVerification();
      router.push("/chat");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Login failed. Please try again.";
      setSubmitError(msg);
      toast.error(msg, { duration: 5000 });

      if (msg.toLowerCase().includes("not verified")) {
        const identifier = data.identifier.trim();
        const type: VerificationType = identifier.includes("@") ? "email" : "phone";
        const target = type === "email" ? identifier.toLowerCase() : identifier;

        if (target) {
          savePendingVerification({ type, target });
          setPendingVerification({ type, target });
        }
      }
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-7 shadow-soft sm:p-8">
      <div className="mb-8">
        <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Sign In
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-border/70 bg-background">
            <span className="font-display text-lg font-semibold">E</span>
          </div>
          <div>
            <h1 className="text-3xl leading-[0.98] font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to anonimi</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Email or phone
          </label>
          <input
            {...register("identifier")}
            type="text"
            autoComplete="email"
            placeholder="john@example.com"
            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {errors.identifier && (
            <p className="text-destructive text-xs mt-1">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</label>
            <Link
              href="/forgot-password"
              className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-border/70 bg-background px-3 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">
              {errors.password.message}
            </p>
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
              <LogIn className="w-4 h-4" />
              Sign in
            </>
          )}
        </button>

        {submitError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {pendingVerification && (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/verify?target=${encodeURIComponent(pendingVerification.target)}&type=${pendingVerification.type}`
              )
            }
            className="h-10 w-full rounded-xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Continue verification
          </button>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
