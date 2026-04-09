export type ReportTargetType = "message" | "user" | "group";
export type ReportReason =
  | "harassment"
  | "spam"
  | "hate_speech"
  | "violence"
  | "explicit_content"
  | "misinformation"
  | "other";
export type ReportStatus = "pending" | "under_review" | "claimed" | "resolved" | "dismissed";
export type ReportTargetUserRole = "user" | "support_staff" | "moderator" | "super_admin";

export interface Report {
  id: string;
  reporterId: string | null;
  reporterUsername: string | null;
  reporter?: {
    id: string;
    username: string | null;
    anonimiId: string | null;
    profileImage: string | null;
  } | null;
  targetType: ReportTargetType;
  targetId: string | null;
  targetUser?: {
    id: string;
    username: string | null;
    anonimiId: string | null;
    profileImage: string | null;
    role?: ReportTargetUserRole | null;
  } | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedBy?: {
    id: string;
    username: string;
  } | null;
  claimedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  messageSnapshot?: {
    content: string | null;
    senderId: string | null;
    senderUsername: string | null;
    type: string;
    createdAt: string;
    mediaUrl?: string | null;
  } | null;
}
