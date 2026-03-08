"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  MessageSquare,
  Flag,
  LifeBuoy,
  Ban,
  Users2,
  UserPlus,
  Activity,
} from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import MetricCard from "@/components/admin/MetricCard";
import api from "@/lib/api";
import type { AnalyticsOverview } from "@/types/admin";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics/overview");
      return res.data.data as AnalyticsOverview;
    },
    refetchInterval: 30_000,
  });

  return (
    <AdminRoute>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform overview and key metrics</p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Total Users"
              value={data?.totalUsers ?? 0}
              icon={Users}
              color="info"
              loading={isLoading}
            />
            <MetricCard
              title="Active Users (24h)"
              value={data?.activeUsers ?? 0}
              icon={Activity}
              color="success"
              loading={isLoading}
            />
            <MetricCard
              title="Messages Today"
              value={data?.messagesLast24h ?? 0}
              icon={MessageSquare}
              color="default"
              loading={isLoading}
            />
            <MetricCard
              title="Groups"
              value={data?.groupsCreated ?? 0}
              icon={Users2}
              color="default"
              loading={isLoading}
            />
            <MetricCard
              title="Pending Reports"
              value={data?.pendingReports ?? 0}
              icon={Flag}
              color={data && data.pendingReports > 0 ? "danger" : "default"}
              loading={isLoading}
            />
            <MetricCard
              title="Open Tickets"
              value={data?.openTickets ?? 0}
              icon={LifeBuoy}
              color={data && data.openTickets > 0 ? "warning" : "default"}
              loading={isLoading}
            />
            <MetricCard
              title="Active Bans"
              value={data?.activeBans ?? 0}
              icon={Ban}
              color={data && data.activeBans > 0 ? "danger" : "default"}
              loading={isLoading}
            />
            <MetricCard
              title="New Users (7d)"
              value={"-"}
              icon={UserPlus}
              color="info"
              loading={isLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/reports"
                className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl hover:bg-orange-500/15 transition-colors"
              >
                <Flag className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Pending Reports</p>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "..." : `${data?.pendingReports ?? 0} waiting for review`}
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/support"
                className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/15 transition-colors"
              >
                <LifeBuoy className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Open Tickets</p>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "..." : `${data?.openTickets ?? 0} need attention`}
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-4 bg-muted/50 border border-border/30 rounded-2xl hover:bg-muted/70 transition-colors"
              >
                <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Search Users</p>
                  <p className="text-xs text-muted-foreground">Find and manage user accounts</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
