"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Search } from "lucide-react";
import AdminRoute from "@/components/shared/AdminRoute";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AdminWarning } from "@/types/admin";
import { resolveMediaUrl } from "@/lib/mediaUrl";

function WarningRow({ warning }: { warning: AdminWarning }) {
  const profileImage = warning.profileImage ? resolveMediaUrl(warning.profileImage) : null;

  const userLabel = warning.username ? `@${warning.username}` : "Unknown user";
  const userMeta = warning.anonimiId ? `(${warning.anonimiId})` : "";

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0">
      <div className="relative">
        {profileImage ? (
          <img
            src={profileImage}
            alt={warning.username ?? "user"}
            className="w-10 h-10 rounded-xl object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">
              {warning.username?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-3 h-3" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {warning.userId ? (
            <Link
              href={`/admin/users/${warning.userId}`}
              className="text-sm font-semibold hover:underline"
            >
              {userLabel}
            </Link>
          ) : (
            <span className="text-sm font-semibold">{userLabel}</span>
          )}
          {userMeta && (
            <span className="text-xs text-muted-foreground">{userMeta}</span>
          )}
          <span className="text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
            Warning issued
          </span>
        </div>
        {warning.message && (
          <p className="text-xs text-muted-foreground">{warning.message}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          by <span className="text-foreground/70 font-medium">{warning.adminUsername ?? "Admin"}</span>
        </p>
      </div>

      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
        {new Date(warning.createdAt).toLocaleString()}
      </span>
    </div>
  );
}

export default function AdminWarningsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-warnings"],
    queryFn: async () => {
      const res = await api.get("/admin/warnings", { params: { limit: 100 } });
      return res.data.data as AdminWarning[];
    },
  });

  const warnings = data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return warnings;

    return warnings.filter((warning) => {
      const values = [
        warning.username ?? "",
        warning.anonimiId ?? "",
        warning.message ?? "",
        warning.adminUsername ?? "",
      ];

      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [warnings, search]);

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <div>
            <h1 className="text-xl font-display font-semibold">Warnings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review every warning issued to users.
            </p>
          </div>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, admin, or message"
              className={cn(
                "w-full h-9 pl-9 pr-3 rounded-lg border border-border/40 bg-muted/40 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              )}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">No warnings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or check back later.
              </p>
            </div>
          ) : (
            filtered.map((warning) => (
              <WarningRow key={warning.id} warning={warning} />
            ))
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
