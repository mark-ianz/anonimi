import Link from "next/link";
import { Flag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/report";

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  claimed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  resolved: "bg-green-500/15 text-green-600 dark:text-green-400",
  dismissed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  claimed: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const reasonLabels: Record<string, string> = {
  harassment: "Harassment",
  spam: "Spam",
  hate_speech: "Hate Speech",
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

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Link
      href={`/admin/reports/${report.id}`}
      className="block px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Flag className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {reasonLabels[report.reason] ?? report.reason}
            </span>
            <span className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
              {targetTypeLabels[report.targetType] ?? report.targetType}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Reported by <span className="text-foreground/70">{report.reporterUsername}</span>
            {report.description && ` · "${report.description}"`}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString()}
            </div>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColors[report.status])}>
              {statusLabels[report.status] ?? report.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
