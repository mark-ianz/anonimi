"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminRoute from "@/components/shared/AdminRoute";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import api from "@/lib/api";
import type { AdminDeletionRequest } from "@/types/admin";
import { toast } from "sonner";
import UserAvatar from "@/components/shared/UserAvatar";
import { API_BASE } from "@/lib/constants";

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [pendingApprove, setPendingApprove] = useState<AdminDeletionRequest | null>(null);
  const [pendingReject, setPendingReject] = useState<AdminDeletionRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: async () => {
      const res = await api.get("/admin/approvals/deletions", { params: { status: "pending" } });
      return res.data.data as AdminDeletionRequest[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/admin/approvals/deletions/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
      toast.success("User deleted");
      setPendingApprove(null);
    },
    onError: () => toast.error("Failed to approve delete request"),
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/admin/approvals/deletions/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
      toast.success("Delete request rejected");
      setPendingReject(null);
    },
    onError: () => toast.error("Failed to reject delete request"),
  });

  const requests = data ?? [];

  return (
    <AdminRoute>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/30 shrink-0">
          <h1 className="text-xl font-display font-semibold">Approvals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pending user deletion requests</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex justify-center py-16">
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0"
              >
                <UserAvatar
                  imageUrl={
                    request.user?.profileImage
                      ? `${API_BASE.replace("/api", "")}${request.user.profileImage}`
                      : null
                  }
                  name={request.user?.username ?? "User"}
                  alt={request.user?.username ?? "User"}
                  className="w-10 h-10 shrink-0"
                  textClassName="text-sm"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {request.user?.username ?? "Unknown user"}
                    </p>
                    {request.user?.anonimiId && (
                      <span className="text-[10px] text-muted-foreground">
                        @{request.user.anonimiId}
                      </span>
                    )}
                    {request.user?.role && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {request.user.role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested by {request.requestedBy?.username ?? "Unknown"}
                  </p>
                  {request.reason && (
                    <p className="text-xs text-muted-foreground">Reason: {request.reason}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPendingReject(request)}
                    className="h-8 px-3 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setPendingApprove(request)}
                    className="h-8 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                  >
                    Approve & Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {pendingApprove && (
        <ConfirmDialog
          open={!!pendingApprove}
          onClose={() => setPendingApprove(null)}
          onConfirm={() => approveMutation.mutate(pendingApprove.id)}
          title={`Delete @${pendingApprove.user?.username ?? "user"}?`}
          description="This will permanently delete the user and cannot be undone."
          confirmLabel="Delete User"
          variant="destructive"
          loading={approveMutation.isPending}
        />
      )}

      {pendingReject && (
        <ConfirmDialog
          open={!!pendingReject}
          onClose={() => setPendingReject(null)}
          onConfirm={() => rejectMutation.mutate(pendingReject.id)}
          title="Reject delete request?"
          description={`This will keep @${pendingReject.user?.username ?? "user"} active.`}
          confirmLabel="Reject"
          loading={rejectMutation.isPending}
        />
      )}
    </AdminRoute>
  );
}
