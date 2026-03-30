"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useContacts } from "@/hooks/useContacts";
import type { SearchUser } from "@/types/user";
import UserCard from "./UserCard";
import SearchInput from "@/components/shared/SearchInput";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";

interface UserSearchResultsProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export default function UserSearchResults({
  query,
  onQueryChange,
}: UserSearchResultsProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [requestedEchoIds, setRequestedEchoIds] = useState<Set<string>>(new Set());
  const resolvedQuery = query ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;
  const debounced = useDebounce(resolvedQuery, 350);
  const { sendRequestAsync } = useContacts();
  const router = useRouter();

  const { data, isFetching } = useQuery({
    queryKey: ["users", "search", debounced],
    queryFn: async () => {
      const res = await api.get("/users/search", { params: { q: debounced, limit: 10 } });
      return res.data.data as SearchUser[];
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 30,
  });

  const openConversationMutation = useMutation({
    mutationFn: async (echoId: string) => {
      const res = await api.post("/conversations", { participantEchoId: echoId });
      return res.data.data as { conversationId: string };
    },
    onSuccess: (data) => {
      router.push(`/chat/${data.conversationId}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to open conversation.";
      toast.error(msg);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        placeholder="Search by username or EchoID..."
        value={resolvedQuery}
        onChange={setQuery}
      />

      {isFetching && <LoadingSkeleton rows={3} variant="conversation" />}

      {!isFetching && data && data.length === 0 && debounced.length >= 2 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No users found for &quot;{debounced}&quot;
        </p>
      )}

      {data && data.map((user) => {
        const dynamicUser = requestedEchoIds.has(user.echoId)
          ? { ...user, isContact: true }
          : user;

        return (
          <UserCard
            key={user.id}
            user={dynamicUser}
            showActions
            onAddContact={async (echoId) => {
              try {
                await sendRequestAsync(echoId);
                setRequestedEchoIds((prev) => new Set(prev).add(echoId));
              } catch {
                // Error toast is handled by useContacts.
              }
            }}
            onMessage={(echoId) => openConversationMutation.mutate(echoId)}
          />
        );
      })}
    </div>
  );
}

