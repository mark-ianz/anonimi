"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useContacts } from "@/hooks/useContacts";
import type { SearchUser } from "@/types/user";
import UserCard from "./UserCard";
import SearchInput from "@/components/shared/SearchInput";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

export default function UserSearchResults() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 350);
  const { sendRequest } = useContacts();

  const { data, isFetching } = useQuery({
    queryKey: ["users", "search", debounced],
    queryFn: async () => {
      const res = await api.get("/users/search", { params: { q: debounced, limit: 10 } });
      return res.data.data as SearchUser[];
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 30,
  });

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        placeholder="Search by username or EchoID..."
        value={query}
        onChange={setQuery}
      />

      {isFetching && <LoadingSkeleton rows={3} variant="conversation" />}

      {!isFetching && data && data.length === 0 && debounced.length >= 2 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No users found for &quot;{debounced}&quot;
        </p>
      )}

      {data && data.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          showActions
          onAddContact={(echoId) => sendRequest(echoId)}
        />
      ))}
    </div>
  );
}
