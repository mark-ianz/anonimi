"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import AdminLogEntry from "@/components/admin/AdminLogEntry";
import api from "@/lib/api";
import type { AdminLog } from "@/types/admin";
import { useAuthStore } from "@/stores/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const actionOptions = [
  { value: "all", label: "All actions" },
  { value: "warn_user", label: "Warned User" },
  { value: "ban_user", label: "Banned User" },
  { value: "unban_user", label: "Unbanned User" },
  { value: "claim_report", label: "Claimed Report" },
  { value: "resolve_report", label: "Resolved Report" },
  { value: "dismiss_report", label: "Dismissed Report" },
  { value: "reply_ticket", label: "Replied to Ticket" },
  { value: "assign_ticket", label: "Assigned Ticket" },
  { value: "view_conversation", label: "Viewed Conversation" },
  { value: "request_delete_user", label: "Requested Deletion" },
  { value: "approve_delete_user", label: "Approved Deletion" },
  { value: "reject_delete_user", label: "Rejected Deletion" },
  { value: "delete_user", label: "Deleted User" },
  { value: "update_contact_message_status", label: "Updated Contact Message" },
  { value: "delete_contact_message", label: "Deleted Contact Message" },
];

export default function AdminLogsPage() {
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", debouncedQuery, actionFilter, sortOrder],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "100" };
      if (debouncedQuery) params.q = debouncedQuery;
      if (actionFilter !== "all") params.action = actionFilter;
      if (sortOrder !== "newest") params.sort = sortOrder;
      const res = await api.get("/admin/logs", { params });
      return res.data.data as AdminLog[];
    },
  });

  const logs = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Admin Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.role === "super_admin"
              ? "Audit trail of all admin actions"
              : "Audit trail of support staff actions"}
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by reason, notes, admin, or user..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
