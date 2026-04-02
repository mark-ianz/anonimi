"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/report";
import { API_BASE } from "@/lib/constants";

const reasonLabels: Record<string, string> = {
  harassment: "Harassment",
  spam: "Spam",
  scam: "Scam",
  impersonation: "Impersonation",
  hate_speech: "Hate Speech",
  illegal_content: "Illegal Content",
  violence: "Violence",
  explicit_content: "Explicit Content",
  misinformation: "Misinformation",
  other: "Other",
};

const targetTypeLabels: Record<string, string> = {
  message: "Message",
  user: "User",
  group: "Group",
};

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  under_review: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  claimed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  resolved: "bg-green-500/15 text-green-600 dark:text-green-400",
  dismissed: "bg-muted text-muted-foreground",
};

const resolutionActions = [
  { value: "no_action", label: "No Action" },
  { value: "warning_issued", label: "Warning Issued" },
  { value: "user_banned", label: "Ban User" },
  { value: "content_removed", label: "Content Removed" },
];

interface ReportDetailProps {
  report: Report;
}

export default function ReportDetail({ report }: ReportDetailProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("no_action");
  const [reporterNote, setReporterNote] = useState("");
  const storageKey = `report-resolution-${report.id}`;
  const hasLoadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hasLoadedRef.current = false;
    skipNextSaveRef.current = false;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { action?: string; notes?: string; reporterNote?: string };
        if (parsed.action) setAction(parsed.action);
        if (typeof parsed.notes === "string") setNotes(parsed.notes);
        if (typeof parsed.reporterNote === "string") setReporterNote(parsed.reporterNote);
        skipNextSaveRef.current = true;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    hasLoadedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoadedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const payload = JSON.stringify({ action, notes, reporterNote });
    window.localStorage.setItem(storageKey, payload);
  }, [action, notes, reporterNote, storageKey]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/reports/${report.id}/claim`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report", report.id] });
      toast.success("Report claimed");
    },
    onError: () => toast.error("Failed to claim report"),
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/reports/${report.id}/resolve`, {
        resolution: action,
        resolutionNotes: notes.trim() || undefined,
        reporterNote: reporterNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report", report.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      toast.success("Report resolved");
    },
    onError: () => toast.error("Failed to resolve report"),
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/reports/${report.id}/dismiss`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report", report.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      toast.success("Report dismissed");
    },
    onError: () => toast.error("Failed to dismiss report"),
  });

  const isPending = report.status === "pending";
  const isClaimed = report.status === "claimed" || report.status === "under_review";

  const reporter = report.reporter ?? null;
  const targetUser = report.targetUser ?? null;

  const profileImageUrl = (value?: string | null) =>
    value ? `${API_BASE.replace("/api", "")}${value}` : null;

  return (
    <div className="space-y-4">
      {/* Report Info */}
      <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Report Details</h2>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[report.status])}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Target Type</p>
            <p className="font-medium">{targetTypeLabels[report.targetType]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reason</p>
            <p className="font-medium">{reasonLabels[report.reason]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reported By</p>
            <p className="font-medium">{report.reporterUsername ?? reporter?.username ?? "Unknown"}</p>
          </div>
          {report.reviewedBy?.username && (
            <div>
              <p className="text-muted-foreground">Claimed By</p>
              <p className="font-medium">{report.reviewedBy.username}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {report.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm bg-background/60 border border-border/30 rounded-xl p-2.5">
              {report.description}
            </p>
          </div>
        )}
      </div>

      {(reporter || targetUser) && (
        <div className="grid gap-3 md:grid-cols-2">
          {reporter && (
            <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Reporting User
              </p>
              <div className="flex items-center gap-3">
                {profileImageUrl(reporter.profileImage) ? (
                  <img
                    src={profileImageUrl(reporter.profileImage) as string}
                    alt={reporter.username ?? "reporter"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {reporter.username?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{reporter.username ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">@{reporter.anonimiId ?? "—"}</p>
                </div>
                <Link
                  href={`/admin/users/${reporter.id}`}
                  className="h-8 px-3 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors inline-flex items-center justify-center"
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}

          {targetUser && (
            <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Reported User
              </p>
              <div className="flex items-center gap-3">
                {profileImageUrl(targetUser.profileImage) ? (
                  <img
                    src={profileImageUrl(targetUser.profileImage) as string}
                    alt={targetUser.username ?? "reported user"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {targetUser.username?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{targetUser.username ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">@{targetUser.anonimiId ?? "—"}</p>
                </div>
                <Link
                  href={`/admin/users/${targetUser.id}`}
                  className="h-8 px-3 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors inline-flex items-center justify-center"
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message snapshot */}
      {report.messageSnapshot && (
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-semibold">Message Snapshot</h2>
          <div className="bg-background/60 border border-border/30 rounded-xl p-3 text-sm space-y-1">
            <p className="text-xs text-muted-foreground">
              From <span className="text-foreground/70">{report.messageSnapshot.senderUsername}</span> ·{" "}
              {new Date(report.messageSnapshot.createdAt).toLocaleString()}
            </p>
            <p>{report.messageSnapshot.content ?? "[No content]"}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {(isPending || isClaimed) && (
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Actions</h2>

          {isPending && (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {claimMutation.isPending ? "Claiming..." : "Claim Report"}
            </button>
          )}

          {isClaimed && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Resolution Action</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {resolutionActions.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAction(a.value)}
                      className={cn(
                        "h-9 rounded-xl border text-xs font-medium transition-colors",
                        action === a.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/40 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Resolution Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes explaining the decision..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-background/60 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Reporter Note (optional)
                </label>
                <textarea
                  value={reporterNote}
                  onChange={(e) => setReporterNote(e.target.value)}
                  placeholder="Optional message visible to the reporter..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-background/60 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending || !notes.trim()}
                  className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                </button>
                <button
                  onClick={() => dismissMutation.mutate()}
                  disabled={dismissMutation.isPending}
                  className="flex-1 h-9 rounded-xl bg-muted/60 text-muted-foreground text-sm font-medium disabled:opacity-50 hover:bg-muted transition-colors"
                >
                  {dismissMutation.isPending ? "Dismissing..." : "Dismiss"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
