"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const email = watch("email");

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/forgot-password", data);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="glass rounded-2xl p-8 shadow-elevated text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-4 bg-primary/10 mx-auto">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
          Check your inbox
        </h1>
        <p className="text-muted-foreground text-sm">
          If an account with{" "}
          <span className="font-medium text-foreground">{email}</span> exists,
          we&apos;ve sent a password reset link.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-primary font-medium hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-elevated">
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-4"
          style={{ background: "var(--anonimi-gradient)" }}
        >
          <span className="text-white font-display font-bold text-2xl">E</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: "var(--anonimi-gradient)" }}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
