"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import ReportDetail from "@/components/admin/ReportDetail";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Report } from "@/types/report";

export default function AdminReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-report", reportId],
    queryFn: async () => {
      const res = await api.get(`/admin/reports/${reportId}`);
      return res.data.data as Report;
    },
    enabled: !!reportId,
  });

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-display font-semibold">Report Detail</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !data ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">Report not found</p>
            </div>
          ) : (
            <div className="p-4 max-w-2xl mx-auto w-full">
              <ReportDetail report={data} />
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
