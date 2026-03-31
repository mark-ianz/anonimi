import { Server, Socket } from "socket.io";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { User } from "../models/user.model";
import { Conversation } from "../models/conversation.model";
import { emitToConversation, emitToUser } from "../services/notification.service";

export const setupGroupHandler = (io: Server, socket: Socket): void => {
  socket.on("group:join", async (payload: { groupId: string }) => {
    try {
      const { groupId } = payload;
      const userId = socket.data.user?.userId;

      if (!userId) return;

      const group = await Group.findById(groupId);

      if (!group) return;

      const membership = await GroupMember.findOne({
        groupId: group._id,
        userId,
      });

      if (!membership) return;

      socket.join(`group:${groupId}`);
    } catch (error) {
      console.error("Error in group:join:", error);
    }
  });

  socket.on("group:leave", async (payload: { groupId: string }) => {
    try {
      const { groupId } = payload;
      socket.leave(`group:${groupId}`);
    } catch (error) {
      console.error("Error in group:leave:", error);
    }
  });
};

export const notifyGroupMemberJoined = async (
  io: Server,
  groupId: string,
  member: { userId: string; echoId: string; username: string; profileImage?: string; role: string },
  addedBy: { userId: string; username: string }
) => {
  const group = await Group.findById(groupId);

  if (!group) return;

  io.to(`conversation:${group.conversationId.toString()}`).emit("group:member-joined", {
    groupId: groupId,
    member,
    addedBy,
  });
};

export const notifyGroupMemberLeft = async (
  io: Server,
  groupId: string,
  userId: string,
  username: string,
  reason: "left" | "removed",
  removedBy?: string
) => {
  const group = await Group.findById(groupId);

  if (!group) return;

  io.to(`conversation:${group.conversationId.toString()}`).emit("group:memberLeft", {
    groupId,
    userId,
    username,
    reason,
    removedBy,
  });
};

export const notifyGroupUpdated = async (
  io: Server,
  groupId: string,
  changes: {
    name?: string;
    image?: string;
    settings?: {
      joinRequestEnabled?: boolean;
      groupProfileEditPolicy?: "admins_only" | "all_members";
    };
  },
  updatedBy: { userId: string; username: string }
) => {
  const group = await Group.findById(groupId);

  if (!group) return;

  io.to(`conversation:${group.conversationId.toString()}`).emit("group:updated", {
    groupId,
    changes,
    updatedBy,
  });
};

export const notifyGroupRoleChanged = async (
  io: Server,
  groupId: string,
  userId: string,
  username: string,
  oldRole: string,
  newRole: string,
  changedBy: { userId: string; username: string }
) => {
  const group = await Group.findById(groupId);

  if (!group) return;

  io.to(`conversation:${group.conversationId.toString()}`).emit("group:role-changed", {
    groupId,
    userId,
    username,
    oldRole,
    newRole,
    changedBy,
  });
};
