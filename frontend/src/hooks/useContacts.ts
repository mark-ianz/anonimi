"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Contact, ContactRequest } from "@/types/contact";
import { CONTACTS_PER_PAGE } from "@/lib/constants";

export function useContacts() {
  const qc = useQueryClient();

  const contactsQuery = useInfiniteQuery({
    queryKey: ["contacts"],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = {
        status: "accepted",
        limit: CONTACTS_PER_PAGE,
      };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get("/contacts", { params });
      return res.data as {
        data: Contact[];
        pagination?: { nextCursor: string | null; hasMore: boolean };
      };
    },
    getNextPageParam: (lp) => (lp.pagination?.hasMore ? lp.pagination.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });

  const requestsQuery = useInfiniteQuery({
    queryKey: ["contacts", "requests"],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 20 };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get("/contacts/requests", { params });
      // The requests endpoint returns apiSuccess (no pagination wrapper)
      return res.data as {
        data: ContactRequest[];
        pagination?: { nextCursor: string | null; hasMore: boolean };
      };
    },
    getNextPageParam: (lp) => (lp.pagination?.hasMore ? lp.pagination.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (targetAnonimiId: string) => {
      const res = await api.post("/contacts/request", { targetAnonimiId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "search"] });
      toast.success("Contact request sent.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to send request.";
      toast.error(msg);
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (targetAnonimiId: string) => {
      const res = await api.post("/contacts/request/cancel", { targetAnonimiId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "search"] });
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      toast.success("Contact request withdrawn.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to withdraw request.";
      toast.error(msg);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await api.patch(`/contacts/${contactId}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added.");
    },
    onError: () => toast.error("Failed to accept request."),
  });

  const declineMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await api.patch(`/contacts/${contactId}/decline`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
    },
    onError: () => toast.error("Failed to decline request."),
  });

  const removeMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/contacts/${contactId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact removed.");
    },
    onError: () => toast.error("Failed to remove contact."),
  });

  const setNicknameMutation = useMutation({
    mutationFn: async ({ contactId, nickname }: { contactId: string; nickname: string }) => {
      await api.patch(`/contacts/${contactId}/nickname`, { nickname });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Nickname updated.");
    },
    onError: () => toast.error("Failed to set nickname."),
  });

  return {
    contacts: contactsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    isLoadingContacts: contactsQuery.isLoading,
    hasMoreContacts: contactsQuery.hasNextPage,
    fetchMoreContacts: contactsQuery.fetchNextPage,

    requests: requestsQuery.data?.pages.flatMap((p) => p.data) ?? [],
    isLoadingRequests: requestsQuery.isLoading,

    sendRequest: sendRequestMutation.mutate,
    sendRequestAsync: sendRequestMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutate,
    cancelRequestAsync: cancelRequestMutation.mutateAsync,
    acceptRequest: acceptMutation.mutate,
    declineRequest: declineMutation.mutate,
    removeContact: removeMutation.mutate,
    setNickname: setNicknameMutation.mutate,
  };
}
