export type ReportTargetType = "message" | "user" | "group";
export type ReportReason =
  | "harassment"
  | "spam"
  | "hate_speech"
  | "violence"
  | "explicit_content"
  | "misinformation"
  | "other";
export type ReportStatus = "pending" | "claimed" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  claimedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  messageSnapshot?: {
    content: string | null;
    senderId: string;
    senderUsername: string;
    type: string;
    createdAt: string;
  } | null;
}
