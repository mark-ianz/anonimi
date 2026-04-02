export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "waiting_on_support"
  | "waiting_on_user"
  | "resolved"
  | "closed";
export type TicketReason =
  | "login_issues"
  | "account_recovery"
  | "billing"
  | "bug_report"
  | "feature_request"
  | "abuse_report"
  | "other";

export interface SupportTicket {
  id: string;
  subject: string;
  reason: TicketReason;
  status: TicketStatus;
  assignedTo:
    | {
        id: string;
        username: string;
      }
    | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderUsername?: string;
  senderRole: "user" | "staff";
  content?: string | null;
  type?: "text" | "image";
  mediaUrl?: string | null;
  createdAt: string;
}

export interface SupportTicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export type SupportReportStatus = "pending" | "under_review" | "resolved" | "dismissed";

export interface SupportReportItem {
  id: string;
  targetType: "message" | "user" | "group";
  targetId: string;
  reason: string;
  description: string | null;
  status: SupportReportStatus;
  createdAt: string;
  updatedAt: string;
}
