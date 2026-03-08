export type GroupRole = "owner" | "admin" | "member";
export type GroupMemberStatus = "joined" | "invited" | "requested" | "left";

export interface Group {
  id: string;
  conversationId: string;
  name: string;
  image: string | null;
  ownerId: string;
  settings: {
    joinRequestEnabled: boolean;
  };
  memberCount: number;
  myRole: GroupRole;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  role: GroupRole;
  nickname: string | null;
  joinedAt: string;
  status?: GroupMemberStatus;
}

export interface GroupJoinRequest {
  requestId: string;
  user: {
    id: string;
    echoId: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
}
