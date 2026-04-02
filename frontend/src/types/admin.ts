import type { UserRole } from "./user";

export interface AdminUser {
  id: string;
  anonimiId: string;
  username: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: UserRole;
  status: string;
  onlineStatus: string;
  lastSeen: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  messagesLast24h: number;
  groupsCreated: number;
  pendingReports: number;
  openTickets: number;
  activeBans: number;
}

export interface AnalyticsTimeSeries {
  date: string;
  value: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminWarning {
  id: string;
  userId: string | null;
  username: string | null;
  anonimiId: string | null;
  profileImage: string | null;
  adminId: string | null;
  adminUsername: string | null;
  message: string | null;
  createdAt: string;
}

export interface Ban {
  id: string;
  userId: string;
  username: string;
  anonimiId: string;
  profileImage?: string | null;
  reason: string;
  bannedBy: string;
  bannedByUsername: string;
  expiresAt: string | null;
  createdAt: string;
  active: boolean;
}
