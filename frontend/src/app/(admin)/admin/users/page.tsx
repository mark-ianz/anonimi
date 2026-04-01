"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import api from "@/lib/api";
import type { AdminUser } from "@/types/admin";
import Link from "next/link";
import { API_BASE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  banned: "bg-destructive/15 text-destructive",
  pending_verification: "bg-orange-500/15 text-orange-500",
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedQuery],
    queryFn: async () => {
      const params = debouncedQuery ? { q: debouncedQuery } : {};
      const res = await api.get("/admin/users", { params });
      return res.data.data as AdminUser[];
    },
    placeholderData: (prev) => prev,
  });

  const users = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Users</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, email, anonimi..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm text-muted-foreground">
                {query ? "No users found" : "Start searching to find users"}
              </p>
            </div>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0"
              >
                {user.profileImage ? (
                  <img
                    src={`${API_BASE.replace("/api", "")}${user.profileImage}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email} · @{user.anonimiId}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColors[user.status] ?? "bg-muted text-muted-foreground")}>
                    {user.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
