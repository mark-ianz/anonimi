"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Group, GroupMember, GroupJoinRequest, GroupInviteLink, GroupInfoByToken, JoinResult } from "@/types/group";

export function useGroups() {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      description?: string;
      image?: string | null;
      settings?: {
        joinRequestEnabled: boolean;
        nicknameEditPolicy?: "admins_only" | "all_members";
        groupProfileEditPolicy?: "admins_only" | "all_members";
      };
      memberAnonimiIds: string[];
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
    mutationFn: async (patch: Partial<{
      name: string;
      description?: string;
      image: string | null;
      settings: {
        joinRequestEnabled?: boolean;
        nicknameEditPolicy?: "admins_only" | "all_members";
        groupProfileEditPolicy?: "admins_only" | "all_members";
      };
    }>) => {
      const res = await api.patch(`/groups/${groupId}`, patch);
      return res.data.data as Group;
    },
    onSuccess: (updatedGroup) => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", updatedGroup.conversationId] });
      toast.success("Group updated.");
    },
    onError: () => toast.error("Failed to update group."),
  });

  const addMembersMutation = useMutation({
    mutationFn: async (memberAnonimiIds: string[]) => {
      const res = await api.post(`/groups/${groupId}/members`, { memberAnonimiIds });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
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
      qc.invalidateQueries({ queryKey: ["conversations"] });
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
      toast.success("Role updated.");
    },
    onError: () => toast.error("Failed to change role."),
  });

  const muteMemberMutation = useMutation({
    mutationFn: async ({ userId, durationMinutes = 60, reason }: { userId: string; durationMinutes?: number; reason: string }) => {
      const res = await api.post(`/groups/${groupId}/members/${userId}/mute`, { durationMinutes, reason });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Member muted.");
    },
    onError: () => toast.error("Failed to mute member."),
  });

  const setMemberNicknameMutation = useMutation({
    mutationFn: async ({ userId, nickname }: { userId: string; nickname: string | null }) => {
      const res = await api.patch(`/groups/${groupId}/members/${userId}/nickname`, { nickname });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Nickname updated.");
    },
    onError: () => toast.error("Failed to update nickname."),
  });

  const unmuteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/groups/${groupId}/members/${userId}/mute`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Member unmuted.");
    },
    onError: () => toast.error("Failed to unmute member."),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/groups/${groupId}/leave`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("You left the group.");
    },
    onError: () => toast.error("Failed to leave group."),
  });

  const disbandMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/groups/${groupId}`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group disbanded.");
    },
    onError: () => toast.error("Failed to disband group."),
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/groups/${groupId}/transfer-owner`, { userId });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Ownership transferred.");
    },
    onError: () => toast.error("Failed to transfer ownership."),
  });

  const joinRequestsQuery = useQuery({
    queryKey: ["groups", groupId, "join-requests"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/join-requests`);
      return res.data.data as GroupJoinRequest[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 20,
  });

  const decideJoinRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "approve" | "reject" }) => {
      const res = await api.patch(`/groups/${groupId}/join-requests/${requestId}`, { action });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "join-requests"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to update join request."),
  });

  const inviteLinksQuery = useQuery({
    queryKey: ["groups", groupId, "invite-links"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/invite-links`);
      return res.data.data as GroupInviteLink[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 20,
  });

  const createInviteLinkMutation = useMutation({
    mutationFn: async (payload: { expiryMinutes: 30 | 60 | 360 | 1440 | 10080; maxUses?: number; description?: string }) => {
      const res = await api.post(`/groups/${groupId}/invite-links`, payload);
      return res.data.data as GroupInviteLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "invite-links"] });
      toast.success("Invite link created.");
    },
    onError: () => toast.error("Failed to create invite link."),
  });

  const revokeInviteLinkMutation = useMutation({
    mutationFn: async (inviteLinkId: string) => {
      await api.delete(`/groups/${groupId}/invite-links/${inviteLinkId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "invite-links"] });
      toast.success("Invite link revoked.");
    },
    onError: () => toast.error("Failed to revoke invite link."),
  });

  return {
    group: groupQuery.data,
    isLoadingGroup: groupQuery.isLoading,
    members: membersQuery.data ?? [],
    isLoadingMembers: membersQuery.isLoading,
    joinRequests: joinRequestsQuery.data ?? [],
    inviteLinks: inviteLinksQuery.data ?? [],
    updateGroup: updateMutation.mutate,
    updateGroupAsync: (patch: Parameters<typeof updateMutation.mutateAsync>[0]) => updateMutation.mutateAsync(patch),
    addMembers: addMembersMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    changeRole: changeRoleMutation.mutate,
    muteMember: muteMemberMutation.mutate,
    unmuteMember: unmuteMemberMutation.mutate,
    setMemberNickname: setMemberNicknameMutation.mutate,
    decideJoinRequest: decideJoinRequestMutation.mutate,
    createInviteLink: createInviteLinkMutation.mutate,
    revokeInviteLink: revokeInviteLinkMutation.mutate,
    leaveGroup: leaveMutation.mutate,
    isLeaving: leaveMutation.isPending,
    disbandGroup: disbandMutation.mutate,
    transferOwnership: transferOwnershipMutation.mutate,
    isDisbanding: disbandMutation.isPending,
  };
}

export function useGroupJoinByToken(token: string | null) {
  const qc = useQueryClient();

  const groupInfoQuery = useQuery({
    queryKey: ["groups", "join", token],
    queryFn: async () => {
      const res = await api.get(`/groups/join/${token}`);
      return res.data.data as GroupInfoByToken;
    },
    enabled: !!token,
    staleTime: 1000 * 60,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/groups/join/${token}`);
      return res.data.data as JoinResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (data.status === "joined" || data.status === "already_member") {
        toast.success("Joined group successfully.");
      } else if (data.status === "pending_approval") {
        toast.info("Join request submitted. Waiting for approval.");
      }
    },
    onError: () => toast.error("Failed to join group."),
  });

  return {
    groupInfo: groupInfoQuery.data,
    isLoadingGroupInfo: groupInfoQuery.isLoading,
    joinGroup: joinMutation.mutate,
    isJoining: joinMutation.isPending,
  };
}
