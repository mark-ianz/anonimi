export enum UserRole {
  USER = "user",
  SUPER_ADMIN = "super_admin",
  MODERATOR = "moderator",
  SUPPORT_STAFF = "support_staff",
}

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  BANNED = "banned",
}

export enum OnlineStatus {
  ONLINE = "online",
  AWAY = "away",
  DND = "dnd",
  OFFLINE = "offline",
}

export enum AppearanceStatus {
  ONLINE = "online",
  AWAY = "away",
  DND = "dnd",
  INVISIBLE = "invisible",
}

export enum FontStyle {
  MODERN = "modern",
  SYSTEM = "system",
  EDITORIAL = "editorial",
  ROUNDED = "rounded",
  HUMANIST = "humanist",
  MONO = "mono",
}

export enum NotificationSound {
  NOTIFICATION_1 = "notification_1",
  NOTIFICATION_2 = "notification_2",
  NOTIFICATION_3 = "notification_3",
  NOTIFICATION_4 = "notification_4",
  NOTIFICATION_5 = "notification_5",
  NOTIFICATION_6 = "notification_6",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  SYSTEM = "system",
}

export enum ConversationType {
  PRIVATE = "private",
  GROUP = "group",
}

export enum ContactStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export enum GroupRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum ReportReason {
  SPAM = "spam",
  HARASSMENT = "harassment",
  SCAM = "scam",
  IMPERSONATION = "impersonation",
  HATE_SPEECH = "hate_speech",
  ILLEGAL_CONTENT = "illegal_content",
  OTHER = "other",
}

export enum ReportStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export enum ReportResolution {
  WARNING_ISSUED = "warning_issued",
  USER_BANNED = "user_banned",
  CONTENT_REMOVED = "content_removed",
  NO_ACTION = "no_action",
}

export enum TicketReason {
  ACCOUNT_RECOVERY = "account_recovery",
  LOGIN_ISSUES = "login_issues",
  BUG_REPORT = "bug_report",
  FEATURE_REQUEST = "feature_request",
  OTHER = "other",
}

export enum TicketStatus {
  OPEN = "open",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  WAITING_ON_SUPPORT = "waiting_on_support",
  WAITING_ON_USER = "waiting_on_user",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum BanType {
  TEMPORARY = "temporary",
  PERMANENT = "permanent",
}

export enum RequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  IGNORED = "ignored",
}
