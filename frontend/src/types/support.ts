export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
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
  assignedTo: {
    id: string;
    username: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: "user" | "staff";
  content: string;
  createdAt: string;
}

export interface SupportTicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
}
