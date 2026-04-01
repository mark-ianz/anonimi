import type { OnlineStatus } from "./user";

export type ContactStatus = "accepted" | "pending" | "declined";

export interface Contact {
  contactId: string;
  anonimiId: string;
  username: string;
  nickname: string | null;
  profileImage: string | null;
  onlineStatus: OnlineStatus;
  lastSeen: string | null;
  status: ContactStatus;
  createdAt: string;
}

export interface ContactRequest {
  requestId: string;
  from: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
}
