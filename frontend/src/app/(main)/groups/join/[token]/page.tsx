"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users, AlertTriangle, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { useGroupJoinByToken } from "@/hooks/useGroups";
import { useChatStore } from "@/stores/chatStore";
import GroupAvatar from "@/components/shared/GroupAvatar";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import api from "@/lib/api";
import { AxiosError } from "axios";

type ErrorKind = "not_found" | "expired" | "revoked" | "max_uses" | "unknown";

function JoinGroupContent() {
  const router = useRouter();
  const params = useParams();
  const token = (params.token as string) ?? null;
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const { groupInfo, isLoadingGroupInfo, joinGroup, isJoining } = useGroupJoinByToken(token);

  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [joinStatus, setJoinStatus] = useState<"joined" | "already_member" | "pending_approval" | null>(null);
  const [joinedConversationId, setJoinedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!groupInfo?.alreadyMember || !groupInfo.conversationId) return;

    setJoinStatus("already_member");
    setJoinedConversationId(groupInfo.conversationId);
    setActiveConversation(groupInfo.conversationId);

    const timer = window.setTimeout(() => {
      router.push(`/chat/${groupInfo.conversationId}`);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [groupInfo?.alreadyMember, groupInfo?.conversationId, router, setActiveConversation]);

  useEffect(() => {
    if (!token) return;

    const checkError = async () => {
      try {
        await api.get(`/groups/join/${token}`);
      } catch (err) {
        if (err instanceof AxiosError) {
          const status = err.response?.status;
          const message = err.response?.data?.message?.toLowerCase() ?? "";
          if (status === 404) setErrorKind("not_found");
          else if (message.includes("expir")) setErrorKind("expired");
          else if (message.includes("revok")) setErrorKind("revoked");
          else if (message.includes("max")) setErrorKind("max_uses");
          else setErrorKind("unknown");
        }
      }
    };

    checkError();
  }, [token]);

  const handleJoin = () => {
    joinGroup(undefined, {
      onSuccess: (data) => {
        if (data.status === "joined" || data.status === "already_member") {
          setJoinStatus(data.status);
          if (data.conversationId) {
            setJoinedConversationId(data.conversationId);
            setActiveConversation(data.conversationId);
          }
        } else if (data.status === "pending_approval") {
          setJoinStatus("pending_approval");
        }
      },
      onError: () => {
        setErrorKind("unknown");
      },
    });
  };

  const handleOpenConversation = () => {
    if (joinedConversationId) {
      router.push(`/chat/${joinedConversationId}`);
    } else {
      router.push("/chat?tab=groups");
    }
  };

  if (errorKind) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {errorKind === "not_found" && "Invalid Invite Link"}
            {errorKind === "expired" && "Invite Link Expired"}
            {errorKind === "revoked" && "Invite Link Revoked"}
            {errorKind === "max_uses" && "Invite Link Full"}
            {errorKind === "unknown" && "Unable to Join"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {errorKind === "not_found" && "This invite link is invalid or has been removed."}
            {errorKind === "expired" && "This invite link has expired. Ask for a new one."}
            {errorKind === "revoked" && "This invite link has been revoked by an admin."}
            {errorKind === "max_uses" && "This invite link has reached its maximum number of uses."}
            {errorKind === "unknown" && "Something went wrong while processing this invite link."}
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  if (joinStatus === "pending_approval") {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Join Request Submitted</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This group requires approval. Your request has been sent to the admins.
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  if (joinStatus === "joined" || joinStatus === "already_member") {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {joinStatus === "already_member" ? "Already a Member" : "Joined Group!"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {joinStatus === "already_member"
              ? `You are already a member of this group. Redirecting you to ${groupInfo?.groupName ?? "the group"} now.`
              : `You've joined ${groupInfo?.groupName ?? "the group"} successfully.`}
          </p>
          <button
            onClick={handleOpenConversation}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Open Conversation
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingGroupInfo) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Unable to Load</h1>
          <p className="text-muted-foreground text-sm mb-6">Could not load group information.</p>
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <GroupAvatar
            imageUrl={groupInfo.groupImage}
            name={groupInfo.groupName}
            className="h-20 w-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold mb-1">{groupInfo.groupName}</h1>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{groupInfo.memberCount} members</span>
          </div>
        </div>

        {groupInfo.description && (
          <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
            {groupInfo.description}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isJoining ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Joining...
            </>
          ) : (
            "Join Group"
          )}
        </button>

        <button
          onClick={() => router.push("/chat")}
          className="w-full mt-3 h-10 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chats
        </button>
      </div>
    </div>
  );
}

export default function GroupJoinPage() {
  return (
    <ProtectedRoute>
      <JoinGroupContent />
    </ProtectedRoute>
  );
}
