"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import api from "@/lib/api";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import GroupAvatar from "@/components/shared/GroupAvatar";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface AdminGroup {
  id: string;
  name: string;
  image: string | null;
  ownerId: string;
  memberCount: number;
  memberPreview?: Array<{ username: string | null; profileImage: string | null }>;
  createdAt: string;
}

export default function AdminGroupsPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-groups", debouncedQuery],
    queryFn: async () => {
      const params = debouncedQuery ? { q: debouncedQuery } : {};
      const res = await api.get("/admin/groups", { params });
      return res.data.data as AdminGroup[];
    },
    placeholderData: (prev) => prev,
  });

  const groups = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0 space-y-3">
          <h1 className="text-xl font-display font-semibold">Groups</h1>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups..."
            className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">No groups found</p>
            </div>
          ) : (
            groups.map((group) => (
              <Link
                key={group.id}
                href={`/admin/groups/${group.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0"
              >
                <GroupAvatar
                  imageUrl={group.image ? resolveMediaUrl(group.image) : null}
                  fallbackProfileImages={(group.memberPreview ?? []).map((m) => m.profileImage)}
                  name={group.name}
                  alt={group.name}
                  className="w-10 h-10"
                  roundedClassName="rounded-xl"
                  textClassName="text-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.memberCount} members · {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
