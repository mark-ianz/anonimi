"use client";

import { useQuery } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import AdminLogEntry from "@/components/admin/AdminLogEntry";
import api from "@/lib/api";
import type { AdminLog } from "@/types/admin";
import { useAuthStore } from "@/stores/authStore";

export default function AdminLogsPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const res = await api.get("/admin/logs", { params: { limit: 100 } });
      return res.data.data as AdminLog[];
    },
  });

  const logs = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0">
          <h1 className="text-xl font-display font-semibold">Admin Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.role === "super_admin"
              ? "Audit trail of all admin actions"
              : "Audit trail of support staff actions"}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">No logs found</p>
            </div>
          ) : (
            logs.map((log) => <AdminLogEntry key={log.id} log={log} />)
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
