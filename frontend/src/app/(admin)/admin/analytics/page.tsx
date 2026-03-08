"use client";

import { useQuery } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import MetricCard from "@/components/admin/MetricCard";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AnalyticsOverview, AnalyticsTimeSeries } from "@/types/admin";
import { Users, MessageSquare, UserPlus, Activity } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics/overview");
      return res.data.data as AnalyticsOverview;
    },
    refetchInterval: 30_000,
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ["admin-analytics-users"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics/users");
      return res.data.data as { registrations: AnalyticsTimeSeries[]; dau: AnalyticsTimeSeries[] };
    },
    enabled: isSuperAdmin,
  });

  const { data: messageAnalytics } = useQuery({
    queryKey: ["admin-analytics-messages"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics/messages");
      return res.data.data as { daily: AnalyticsTimeSeries[] };
    },
    enabled: isSuperAdmin,
  });

  return (
    <AdminRoute>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-display font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform metrics and trends</p>
          </div>

          {/* Overview metrics */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Overview
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                title="Total Users"
                value={overview?.totalUsers ?? 0}
                icon={Users}
                color="info"
                loading={overviewLoading}
              />
              <MetricCard
                title="Active (24h)"
                value={overview?.activeUsers ?? 0}
                icon={Activity}
                color="success"
                loading={overviewLoading}
              />
              <MetricCard
                title="Messages (24h)"
                value={overview?.messagesLast24h ?? 0}
                icon={MessageSquare}
                color="default"
                loading={overviewLoading}
              />
              <MetricCard
                title="Total Groups"
                value={overview?.groupsCreated ?? 0}
                icon={UserPlus}
                color="default"
                loading={overviewLoading}
              />
            </div>
          </div>

          {/* Charts (Super Admin only) */}
          {isSuperAdmin && (
            <div className="space-y-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Trends (30 days)
              </h2>

              {userAnalytics?.registrations && userAnalytics.registrations.length > 0 && (
                <AnalyticsChart
                  data={userAnalytics.registrations}
                  label="New Registrations"
                  color="hsl(var(--primary))"
                />
              )}

              {userAnalytics?.dau && userAnalytics.dau.length > 0 && (
                <AnalyticsChart
                  data={userAnalytics.dau}
                  label="Daily Active Users"
                  color="oklch(0.7 0.15 145)"
                />
              )}

              {messageAnalytics?.daily && messageAnalytics.daily.length > 0 && (
                <AnalyticsChart
                  data={messageAnalytics.daily}
                  label="Messages Per Day"
                  color="oklch(0.65 0.15 250)"
                />
              )}

              {!userAnalytics && !messageAnalytics && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          )}

          {!isSuperAdmin && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Detailed analytics are available to Super Admins.
            </p>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
