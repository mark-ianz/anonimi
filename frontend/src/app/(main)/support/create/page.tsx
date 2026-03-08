"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TicketReason } from "@/types/support";

const reasons: { value: TicketReason; label: string }[] = [
  { value: "login_issues", label: "Login Issues" },
  { value: "account_recovery", label: "Account Recovery" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "abuse_report", label: "Abuse Report" },
  { value: "other", label: "Other" },
];

export default function CreateTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState<TicketReason>("other");
  const [message, setMessage] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/support/tickets", { subject, reason, message });
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success("Support ticket created");
      router.replace(`/support/${data.ticketId}`);
    },
    onError: () => {
      toast.error("Failed to create ticket");
    },
  });

  const canSubmit = subject.trim().length >= 5 && message.trim().length >= 20;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-semibold">New Support Ticket</h1>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                maxLength={120}
                className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "h-10 px-3 rounded-xl border text-sm font-medium transition-colors text-left",
                      reason === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Describe your issue
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{message.length} chars (min 20)</p>
            </div>

            {/* Submit */}
            <button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                "Submit Ticket"
              )}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
