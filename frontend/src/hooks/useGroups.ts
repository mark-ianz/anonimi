"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Group, GroupMember, GroupJoinRequest } from "@/types/group";

export function useGroups() {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      image?: string | null;
      memberEchoIds: string[];
    }) => {
      const res = await api.post("/groups", payload);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Group created.");
    },
    onError: () => toast.error("Failed to create group."),
  });

  return {
    createGroup: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useGroup(groupId: string | null) {
  const qc = useQueryClient();

  const groupQuery = useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`);
      return res.data.data as Group;
    },
    enabled: !!groupId,
    staleTime: 1000 * 60,
  });

  const membersQuery = useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data.data as GroupMember[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<{ name: string; image: string | null; settings: { joinRequestEnabled: boolean } }>) => {
      const res = await api.patch(`/groups/${groupId}`, patch);
      return res.data.data as Group;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      toast.success("Group updated.");
    },
    onError: () => toast.error("Failed to update group."),
  });

  const addMembersMutation = useMutation({
    mutationFn: async (memberEchoIds: string[]) => {
      const res = await api.post(`/groups/${groupId}/members`, { memberEchoIds });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Members added.");
    },
    onError: () => toast.error("Failed to add members."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Member removed.");
    },
    onError: () => toast.error("Failed to remove member."),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.patch(`/groups/${groupId}/members/${userId}/role`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
    },
    onError: () => toast.error("Failed to change role."),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/groups/${groupId}/leave`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to leave group."),
  });

  return {
    group: groupQuery.data,
    isLoadingGroup: groupQuery.isLoading,
    members: membersQuery.data ?? [],
    isLoadingMembers: membersQuery.isLoading,
    updateGroup: updateMutation.mutate,
    addMembers: addMembersMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    changeRole: changeRoleMutation.mutate,
    leaveGroup: leaveMutation.mutate,
    isLeaving: leaveMutation.isPending,
  };
}
