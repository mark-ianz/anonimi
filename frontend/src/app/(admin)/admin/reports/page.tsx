"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import ReportCard from "@/components/admin/ReportCard";
import api from "@/lib/api";
import { getAdminSocket } from "@/lib/socket";
import type { Report, ReportStatus } from "@/types/report";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const statuses: { value: ReportStatus | "all" | "mine"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Assigned to me" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "claimed", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | "all" | "mine">("pending");
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      const params = status !== "all" && status !== "mine" ? { status } : {};
      const res = await api.get("/admin/reports", { params });
      return res.data.data as Report[];
    },
    placeholderData: (prev) => prev,
  });

  const reports = (data ?? []).filter((report) => {
    if (status !== "mine") return true;
    return report.reviewedBy?.id === user?.id;
  });

  useEffect(() => {
    const socket = getAdminSocket();
    socket.connect();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    };

    socket.on("admin:report:new", handleUpdate);
    socket.on("admin:report:updated", handleUpdate);

    return () => {
      socket.off("admin:report:new", handleUpdate);
      socket.off("admin:report:updated", handleUpdate);
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Reports</h1>
          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                  status === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm text-muted-foreground">No reports found</p>
            </div>
          ) : (
            reports.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
