export type UserRole = "user" | "moderator" | "support_staff" | "super_admin";
export type UserStatus = "active" | "banned" | "pending_verification";
export type OnlineStatus = "online" | "away" | "dnd" | "offline";
export type AppearanceStatus = "online" | "away" | "dnd" | "invisible";

export interface User {
  id: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  role: UserRole;
  status: UserStatus;
  appearanceStatus: AppearanceStatus;
  onlineStatus: OnlineStatus;
  lastSeen: string;
  createdAt: string;
}

export interface AuthUser extends User {
  email: string | null;
  phone: string | null;
  usernameCanEdit: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface PublicUser {
  id: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  onlineStatus: OnlineStatus;
  lastSeen?: string;
  createdAt?: string;
  isContact?: boolean;
  isBlocked?: boolean;
  contactNickname?: string | null;
}

export interface SearchUser {
  id: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  onlineStatus: OnlineStatus;
}
