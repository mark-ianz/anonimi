import { Types } from "mongoose";
import { Conversation } from "../models/conversation.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { User } from "../models/user.model";
import { Contact } from "../models/contact.model";
import { Message } from "../models/message.model";
import { MessageRequest } from "../models/messageRequest.model";
import { GroupJoinRequest } from "../models/groupJoinRequest.model";
import { GroupInviteLink } from "../models/groupInviteLink.model";
import { emitToConversation, emitToUser } from "./notification.service";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { GroupRole, MessageType } from "../types/enums";
import crypto from "crypto";
import QRCode from "qrcode";
import { getFrontendUrl } from "../config/env";

const INVITE_EXPIRY_PRESET_MINUTES = [30, 60, 360, 1440, 10080] as const;

const formatAutoGroupName = () => {
  const dateText = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `New Group ${dateText}`;
};

const resolveInviteExpiryDate = (expiryMinutes: number) => {
  if (!INVITE_EXPIRY_PRESET_MINUTES.includes(expiryMinutes as any)) {
    throw new ForbiddenError("Invalid invite expiry preset");
  }

  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

const createInviteToken = () => {
  return crypto.randomBytes(24).toString("base64url");
};

const getMembership = async (groupId: Types.ObjectId, userId: string) => {
  return GroupMember.findOne({
    groupId,
    userId: new Types.ObjectId(userId),
  });
};

const createGroupSystemMessage = async (
  conversationId: Types.ObjectId,
  senderUserId: Types.ObjectId,
  content: string
) => {
  const message = await Message.create({
    conversationId,
    senderId: senderUserId,
    type: MessageType.SYSTEM,
    content,
    readBy: [senderUserId],
    readByAt: { [senderUserId.toString()]: new Date() },
    unsent: false,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: {
          content,
          senderId: senderUserId,
          type: MessageType.SYSTEM,
          timestamp: message.createdAt,
        },
        updatedAt: new Date(),
      },
    }
  );

  const [sender, conversation] = await Promise.all([
    User.findById(senderUserId).select("username profileImage").lean(),
    Conversation.findById(conversationId).select("participants").lean(),
  ]);

  const payload = {
    messageId: message._id.toString(),
    conversationId: conversationId.toString(),
    senderId: senderUserId.toString(),
    senderUsername: sender?.username ?? "System",
    senderProfileImage: sender?.profileImage ?? null,
    type: MessageType.SYSTEM,
    content,
    mediaUrl: null,
    fileName: null,
    fileSize: null,
    timestamp: message.createdAt.toISOString(),
  };

  if (conversation?.participants?.length) {
    for (const participantId of conversation.participants) {
      emitToUser(participantId.toString(), "message:receive", payload);
    }
    return;
  }

  emitToConversation(conversationId.toString(), "message:receive", payload);
};

const addMemberToGroup = async (
  groupId: Types.ObjectId,
  conversationId: Types.ObjectId,
  targetUserId: Types.ObjectId,
  options?: {
    joinedVia?: "manual_add" | "invite_link" | "direct_request";
    addedByUserId?: Types.ObjectId;
  }
) => {
  await GroupMember.create({
    groupId,
    userId: targetUserId,
    role: GroupRole.MEMBER,
    joinedVia: options?.joinedVia,
    addedByUserId: options?.addedByUserId,
    joinedAt: new Date(),
  });

  await Conversation.updateOne(
    { _id: conversationId },
    { $addToSet: { participants: targetUserId } }
  );
};

export const createGroup = async (
  ownerId: string,
  name: string | undefined,
  memberAnonimiIds: string[],
  image?: string | null,
  description?: string,
  settings?: {
    joinRequestEnabled: boolean;
    nicknameEditPolicy?: "admins_only" | "all_members";
    groupProfileEditPolicy?: "admins_only" | "all_members";
  }
) => {
  const owner = await User.findById(ownerId).select("_id anonimiId username profileImage");
  const actualOwnerId = ownerId;
  const groupName = name?.trim() ? name.trim() : formatAutoGroupName();

  const participants = [new Types.ObjectId(actualOwnerId)];

  const memberUsers = await User.find({
    anonimiId: { $in: memberAnonimiIds },
  });

  const invitedMembers: Types.ObjectId[] = [];
  const joinedMembers: Types.ObjectId[] = [];

  for (const user of memberUsers) {
    const isContact = await Contact.findOne({
      $or: [
        { userId: actualOwnerId, contactId: user._id, status: "accepted" },
        { userId: user._id, contactId: actualOwnerId, status: "accepted" },
      ],
    });

    if (isContact) {
      joinedMembers.push(user._id);
    } else {
      invitedMembers.push(user._id);
    }
    participants.push(user._id);
  }

  const conversation = await Conversation.create({
    type: "group",
    participants,
  });

  const group = await Group.create({
    conversationId: conversation._id,
    name: groupName,
    description: description?.trim() || undefined,
    image,
    ownerId: new Types.ObjectId(actualOwnerId),
    settings: {
      joinRequestEnabled: settings?.joinRequestEnabled ?? false,
      nicknameEditPolicy: settings?.nicknameEditPolicy ?? "all_members",
      groupProfileEditPolicy: settings?.groupProfileEditPolicy ?? "admins_only",
    },
  });

  await GroupMember.create({
    groupId: group._id,
    userId: new Types.ObjectId(actualOwnerId),
    role: GroupRole.OWNER,
    joinedVia: "group_create",
    joinedAt: new Date(),
  });

  const memberData = [
    {
      userId: actualOwnerId,
      anonimiId: owner?.anonimiId || "",
      role: "owner",
      status: "joined",
    },
  ];

  for (const user of memberUsers) {
    const isContact = await Contact.findOne({
      $or: [
        { userId: actualOwnerId, contactId: user._id, status: "accepted" },
        { userId: user._id, contactId: actualOwnerId, status: "accepted" },
      ],
    });

    await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      role: GroupRole.MEMBER,
      joinedVia: "manual_add",
      addedByUserId: new Types.ObjectId(actualOwnerId),
      joinedAt: isContact ? new Date() : undefined,
    });

    memberData.push({
      userId: user._id.toString(),
      anonimiId: user.anonimiId,
      role: "member",
      status: isContact ? "joined" : "invited",
    });

    if (!isContact) {
      await MessageRequest.create({
        conversationId: conversation._id,
        fromUserId: new Types.ObjectId(actualOwnerId),
        toUserId: user._id,
        status: "pending",
      });
    }
  }

  const ownerName = owner?.username ?? "Someone";
  await createGroupSystemMessage(
    conversation._id,
    new Types.ObjectId(actualOwnerId),
    `${ownerName} created the group chat.`
  );

  if (memberUsers.length > 0) {
    const othersCount = Math.max(memberUsers.length - 1, 0);
    const firstMemberName = memberUsers[0]?.username ?? "a member";
    const ownerAddedMessage =
      memberUsers.length === 1
        ? `You added ${firstMemberName} to the group chat.`
        : `You added ${firstMemberName} and ${othersCount} ${othersCount === 1 ? "other" : "others"} to the group chat.`;
    const memberAddedMessage =
      memberUsers.length === 1
        ? `${ownerName} added you to the group chat.`
        : `${ownerName} added you and ${othersCount} ${othersCount === 1 ? "other" : "others"} to the group chat.`;

    const ownerObjectId = new Types.ObjectId(actualOwnerId);
    const memberObjectIds = memberUsers.map((member) => member._id);

    await Message.create({
      conversationId: conversation._id,
      senderId: ownerObjectId,
      type: MessageType.SYSTEM,
      content: ownerAddedMessage,
      readBy: [ownerObjectId],
      readByAt: { [actualOwnerId]: new Date() },
      deletedFor: memberObjectIds,
      unsent: false,
    });

    await Message.create({
      conversationId: conversation._id,
      senderId: ownerObjectId,
      type: MessageType.SYSTEM,
      content: memberAddedMessage,
      readBy: [ownerObjectId],
      readByAt: { [actualOwnerId]: new Date() },
      deletedFor: [ownerObjectId],
      unsent: false,
    });
  }

  return {
    groupId: group._id.toString(),
    conversationId: conversation._id.toString(),
    name: groupName,
    image: group.image ?? null,
    ownerId: actualOwnerId,
    members: memberData,
    photoFallbackUserIds: memberUsers.slice(0, 3).map((m) => m._id.toString()),
  };
};

export const getGroup = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  if (group.disbandedAt) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership) {
    throw new ForbiddenError("Not authorized to view this group");
  }

  const memberCount = await GroupMember.countDocuments({
    groupId: group._id,
  });

  const photoFallbackMembers = await GroupMember.find({ groupId: group._id })
    .sort({ joinedAt: 1 })
    .limit(3)
    .populate("userId", "_id")
    .lean();

  return {
    id: group._id.toString(),
    conversationId: group.conversationId.toString(),
    name: group.name,
    description: group.description ?? null,
    image: group.image,
    ownerId: group.ownerId.toString(),
    settings: group.settings,
    memberCount,
    photoFallbackUserIds: photoFallbackMembers.map((m: any) => m.userId._id.toString()),
    myRole: membership?.role,
    createdAt: group.createdAt,
  };
};

export const updateGroup = async (
  groupId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    image?: string | null;
    settings?: {
      joinRequestEnabled?: boolean;
      nicknameEditPolicy?: "admins_only" | "all_members";
      groupProfileEditPolicy?: "admins_only" | "all_members";
    };
  }
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership) {
    throw new ForbiddenError("Not authorized to update group");
  }

  const isManager = membership.role === GroupRole.OWNER || membership.role === GroupRole.ADMIN;
  const canEditGroupProfileByPolicy =
    (group.settings?.groupProfileEditPolicy ?? "admins_only") === "all_members";
  const canEditGroupProfile = isManager || canEditGroupProfileByPolicy;

  const hasProfileUpdates =
    updates.name !== undefined || updates.description !== undefined || updates.image !== undefined;
  const hasSettingsUpdates = updates.settings !== undefined;

  if (hasSettingsUpdates && !isManager) {
    throw new ForbiddenError("Not authorized to update group settings");
  }

  if (hasProfileUpdates && !canEditGroupProfile) {
    throw new ForbiddenError("Not authorized to edit group profile");
  }

  if (updates.name !== undefined) group.name = updates.name.trim();
  if (updates.description !== undefined) group.description = updates.description;
  if (updates.image !== undefined) group.image = updates.image;
  if (updates.settings) {
    group.settings = {
      ...group.settings,
      ...updates.settings,
    };
  }

  await group.save();

  return group;
};

export const getGroupMembers = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  if (group.disbandedAt) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership) {
    throw new ForbiddenError("Not authorized to view group members");
  }

  const members = await GroupMember.find({ groupId: group._id })
    .populate("userId", "anonimiId username profileImage")
    .populate("addedByUserId", "anonimiId username")
    .sort({ role: 1, joinedAt: 1 })
    .lean();

  const joinRequests = await GroupJoinRequest.find({
    groupId: group._id,
    status: { $in: ["approved", "pending"] },
  })
    .populate("inviterUserId", "anonimiId username")
    .sort({ createdAt: -1 })
    .lean();

  const requestByUserId = new Map<string, any>();
  for (const req of joinRequests) {
    const uid = req.userId?.toString?.();
    if (!uid || requestByUserId.has(uid)) continue;
    requestByUserId.set(uid, req);
  }

  return members.map((m: any) => ({
    joinedVia: m.joinedVia ?? requestByUserId.get(m.userId._id.toString())?.source ?? "manual_add",
    addedBy: m.addedByUserId
      ? {
          id: m.addedByUserId._id.toString(),
          anonimiId: m.addedByUserId.anonimiId,
          username: m.addedByUserId.username,
        }
      : requestByUserId.get(m.userId._id.toString())?.inviterUserId
      ? {
          id: requestByUserId.get(m.userId._id.toString()).inviterUserId._id.toString(),
          anonimiId: requestByUserId.get(m.userId._id.toString()).inviterUserId.anonimiId,
          username: requestByUserId.get(m.userId._id.toString()).inviterUserId.username,
        }
      : null,
    userId: m.userId._id.toString(),
    anonimiId: m.userId.anonimiId,
    username: m.userId.username,
    profileImage: m.userId.profileImage,
    role: m.role,
    nickname: m.nickname,
    mutedUntil: m.mutedUntil,
    muteReason: m.muteReason,
    joinedAt: m.joinedAt,
  }));
};

export const addMembers = async (
  groupId: string,
  userId: string,
  memberAnonimiIds: string[]
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  if (group.disbandedAt) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership) {
    throw new ForbiddenError("Not authorized to add members");
  }

  const newMembers = await User.find({ anonimiId: { $in: memberAnonimiIds } });

  const added: { anonimiId: string; status: string }[] = [];
  const invited: { anonimiId: string; status: string }[] = [];
  const pendingApproval: { anonimiId: string; status: string; requestId: string }[] = [];

  const canBypassApproval =
    membership.role === GroupRole.OWNER || membership.role === GroupRole.ADMIN;
  const actor = await User.findById(userId).select("username").lean();
  const actorName = actor?.username ?? "a member";

  for (const user of newMembers) {
    const existingMember = await GroupMember.findOne({
      groupId: group._id,
      userId: user._id,
    });

    if (existingMember) continue;

    const isContact = await Contact.findOne({
      $or: [
        { userId: new Types.ObjectId(userId), contactId: user._id, status: "accepted" },
        { userId: user._id, contactId: new Types.ObjectId(userId), status: "accepted" },
      ],
    });

    const requiresApproval = !!group.settings?.joinRequestEnabled && !canBypassApproval;

    if (requiresApproval) {
      const existingPending = await GroupJoinRequest.findOne({
        groupId: group._id,
        userId: user._id,
        status: "pending",
      });

      if (!existingPending) {
        const request = await GroupJoinRequest.create({
          groupId: group._id,
          userId: user._id,
          inviterUserId: new Types.ObjectId(userId),
          source: "manual_add",
          status: "pending",
        });

        pendingApproval.push({
          anonimiId: user.anonimiId,
          status: "pending_approval",
          requestId: request._id.toString(),
        });
      }
      continue;
    }

    await addMemberToGroup(group._id, group.conversationId, user._id, {
      joinedVia: "manual_add",
      addedByUserId: new Types.ObjectId(userId),
    });

    await createGroupSystemMessage(
      group.conversationId,
      new Types.ObjectId(userId),
      `${user.username} was added by ${actorName} (manual add).`
    );

    if (isContact) {
      added.push({ anonimiId: user.anonimiId, status: "joined" });
    } else {
      invited.push({ anonimiId: user.anonimiId, status: "invited" });

      await MessageRequest.create({
        conversationId: group.conversationId,
        fromUserId: new Types.ObjectId(userId),
        toUserId: user._id,
        status: "pending",
      });
    }
  }

  return { added, invited, pendingApproval };
};

export const removeMember = async (
  groupId: string,
  requestingUserId: string,
  memberUserId: string
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const requestingMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(requestingUserId),
  });

  const targetMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(memberUserId),
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found");
  }

  if (requestingUserId !== memberUserId) {
    if (!requestingMembership || requestingMembership.role === GroupRole.MEMBER) {
      throw new ForbiddenError("Not authorized to remove members");
    }

    if (targetMembership.role === GroupRole.OWNER) {
      throw new ForbiddenError("Cannot remove the owner");
    }

    if (
      requestingMembership.role === GroupRole.ADMIN &&
      targetMembership.role === GroupRole.ADMIN
    ) {
      throw new ForbiddenError("Cannot remove another admin");
    }
  }

  await GroupMember.deleteOne({ _id: targetMembership._id });

  await Conversation.updateOne(
    { _id: group.conversationId },
    { $pull: { participants: new Types.ObjectId(memberUserId) } }
  );

  const [actorUser, targetUser] = await Promise.all([
    User.findById(requestingUserId).select("username").lean(),
    User.findById(memberUserId).select("username").lean(),
  ]);

  const actorName = actorUser?.username ?? "A member";
  const targetName = targetUser?.username ?? "A member";
  const content =
    requestingUserId === memberUserId
      ? `${targetName} left the group.`
      : `${targetName} was removed by ${actorName}.`;

  await createGroupSystemMessage(
    group.conversationId,
    new Types.ObjectId(requestingUserId),
    content
  );

  return { message: "Member removed" };
};

export const changeRole = async (
  groupId: string,
  requestingUserId: string,
  targetUserId: string,
  newRole: GroupRole
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const requestingMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(requestingUserId),
  });

  if (!requestingMembership || requestingMembership.role !== GroupRole.OWNER) {
    throw new ForbiddenError("Only the owner can change roles");
  }

  const targetMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(targetUserId),
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found");
  }

  targetMembership.role = newRole;
  await targetMembership.save();

  return targetMembership;
};

export const leaveGroup = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership) {
    throw new NotFoundError("Not a member of this group");
  }

  const leavingUser = await User.findById(userId).select("username").lean();
  const leavingName = leavingUser?.username ?? "A member";

  if (membership.role === GroupRole.OWNER) {
    const admins = await GroupMember.find({
      groupId: group._id,
      role: GroupRole.ADMIN,
    }).sort({ joinedAt: 1, createdAt: 1 });

    const remainingMembers = await GroupMember.find({
      groupId: group._id,
      userId: { $ne: new Types.ObjectId(userId) },
      role: GroupRole.MEMBER,
    }).sort({ joinedAt: 1, createdAt: 1 });

    const nextOwnerMembership = admins[0] ?? remainingMembers[0] ?? null;

    if (nextOwnerMembership) {
      nextOwnerMembership.role = GroupRole.OWNER;
      await nextOwnerMembership.save();

      group.ownerId = new Types.ObjectId(nextOwnerMembership.userId.toString());
      await group.save();

      await GroupMember.deleteOne({ _id: membership._id });
      await Conversation.updateOne(
        { _id: group.conversationId },
        { $pull: { participants: new Types.ObjectId(userId) } }
      );

      const newOwner = await User.findById(nextOwnerMembership.userId).select("username").lean();
      const newOwnerName = newOwner?.username ?? (admins.length > 0 ? "an admin" : "a member");

      await createGroupSystemMessage(
        group.conversationId,
        new Types.ObjectId(userId),
        `${leavingName} left the group. Ownership was transferred to ${newOwnerName}.`
      );

      return {
        message: "You have left the group.",
        ownershipTransferred: true,
        newOwnerId: nextOwnerMembership.userId.toString(),
      };
    }
  }

  await GroupMember.deleteOne({ _id: membership._id });

  await Conversation.updateOne(
    { _id: group.conversationId },
    { $pull: { participants: new Types.ObjectId(userId) } }
  );

  await createGroupSystemMessage(
    group.conversationId,
    new Types.ObjectId(userId),
    `${leavingName} left the group.`
  );

  return {
    message: "You have left the group.",
    ownershipTransferred: false,
  };
};

export const setNickname = async (
  groupId: string,
  userId: string,
  nickname: string | null
) => {
  return setMemberNickname(groupId, userId, userId, nickname);
};

export const setMemberNickname = async (
  groupId: string,
  requestingUserId: string,
  targetUserId: string,
  nickname: string | null
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const requester = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(requestingUserId),
  });

  if (!requester) {
    throw new ForbiddenError("Not authorized to edit nicknames");
  }

  const target = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(targetUserId),
  });

  if (!target) {
    throw new NotFoundError("Member not found");
  }

  const isSelf = requestingUserId === targetUserId;
  const requesterIsAdmin = requester.role === GroupRole.OWNER || requester.role === GroupRole.ADMIN;
  const canEditOthersByPolicy = group.settings?.nicknameEditPolicy === "all_members";

  if (!isSelf && !requesterIsAdmin && !canEditOthersByPolicy) {
    throw new ForbiddenError("Only admins can edit other members' nicknames");
  }

  const previousNickname = target.nickname ?? null;
  const nextNickname = nickname?.trim() ? nickname.trim() : null;

  target.nickname = nextNickname ?? undefined;
  await target.save();

  if (previousNickname !== nextNickname) {
    const [actorUser, targetUser] = await Promise.all([
      User.findById(requestingUserId).select("username").lean(),
      User.findById(targetUserId).select("username").lean(),
    ]);

    const actorName = actorUser?.username ?? "A member";
    const targetName = targetUser?.username ?? "a member";

    const content = nextNickname
      ? isSelf
        ? `${actorName} changed their nickname to ${nextNickname}.`
        : `${actorName} changed ${targetName}'s nickname to ${nextNickname}.`
      : isSelf
      ? `${actorName} cleared their nickname.`
      : `${actorName} cleared ${targetName}'s nickname.`;

    await createGroupSystemMessage(
      group.conversationId,
      new Types.ObjectId(requestingUserId),
      content
    );
  }

  return {
    userId: target.userId.toString(),
    nickname: target.nickname ?? null,
  };
};

export const createJoinRequest = async (
  groupId: string,
  userId: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const existingMember = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });
  if (existingMember) throw new ConflictError("Already a member");

  const existingPending = await GroupJoinRequest.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
    status: "pending",
  });
  if (existingPending) throw new ConflictError("Join request already pending");

  const request = await GroupJoinRequest.create({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
    source: "direct",
    status: "pending",
  });

  return {
    requestId: request._id.toString(),
    status: request.status,
    createdAt: request.createdAt,
  };
};

export const listJoinRequests = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const membership = await getMembership(group._id, userId);
  if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
    throw new ForbiddenError("Not authorized to view join requests");
  }

  const requests = await GroupJoinRequest.find({
    groupId: group._id,
    status: "pending",
  })
    .populate("userId", "anonimiId username profileImage")
    .populate("inviterUserId", "anonimiId username")
    .sort({ createdAt: -1 })
    .lean();

  return requests.map((req: any) => ({
    requestId: req._id.toString(),
    status: req.status,
    source: req.source,
    createdAt: req.createdAt,
    user: {
      id: req.userId?._id?.toString(),
      anonimiId: req.userId?.anonimiId,
      username: req.userId?.username,
      profileImage: req.userId?.profileImage ?? null,
    },
    inviter: req.inviterUserId
      ? {
          id: req.inviterUserId._id.toString(),
          anonimiId: req.inviterUserId.anonimiId,
          username: req.inviterUserId.username,
        }
      : null,
  }));
};

export const decideJoinRequest = async (
  groupId: string,
  requestId: string,
  reviewerUserId: string,
  action: "approve" | "reject"
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const reviewerMembership = await getMembership(group._id, reviewerUserId);
  if (!reviewerMembership || (reviewerMembership.role !== GroupRole.OWNER && reviewerMembership.role !== GroupRole.ADMIN)) {
    throw new ForbiddenError("Not authorized to review join requests");
  }

  const request = await GroupJoinRequest.findOne({
    _id: new Types.ObjectId(requestId),
    groupId: group._id,
    status: "pending",
  });

  if (!request) {
    throw new NotFoundError("Join request not found");
  }

  request.status = action === "approve" ? "approved" : "rejected";
  request.decisionBy = new Types.ObjectId(reviewerUserId);
  request.decisionAt = new Date();
  await request.save();

  if (action === "approve") {
    const existingMember = await GroupMember.findOne({
      groupId: group._id,
      userId: request.userId,
    });

    if (!existingMember) {
      await addMemberToGroup(group._id, group.conversationId, request.userId, {
        joinedVia: request.source === "invite_link" ? "invite_link" : request.source === "direct" ? "direct_request" : "manual_add",
        addedByUserId: request.inviterUserId,
      });

      const [joinedUser, reviewerUser, inviterUser] = await Promise.all([
        User.findById(request.userId).select("username").lean(),
        User.findById(reviewerUserId).select("username").lean(),
        request.inviterUserId
          ? User.findById(request.inviterUserId).select("username").lean()
          : Promise.resolve(null),
      ]);

      const joinedName = joinedUser?.username ?? "A member";
      const reviewerName = reviewerUser?.username ?? "an admin";
      const inviterName = inviterUser?.username;

      const approvalContent =
        request.source === "invite_link"
          ? `${joinedName} joined via invite link${inviterName ? ` by ${inviterName}` : ""} (approved by ${reviewerName}).`
          : request.source === "manual_add"
          ? `${joinedName} was added${inviterName ? ` by ${inviterName}` : ""} (approved by ${reviewerName}).`
          : `${joinedName} joined via join request (approved by ${reviewerName}).`;

      await createGroupSystemMessage(
        group.conversationId,
        new Types.ObjectId(reviewerUserId),
        approvalContent
      );
    }
  }

  return {
    requestId: request._id.toString(),
    status: request.status,
    action,
    decidedAt: request.decisionAt,
  };
};

export const createInviteLink = async (
  groupId: string,
  userId: string,
  expiryMinutes: number,
  maxUses?: number,
  description?: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const membership = await getMembership(group._id, userId);
  if (!membership) throw new ForbiddenError("Not a group member");

  const invite = await GroupInviteLink.create({
    groupId: group._id,
    createdBy: new Types.ObjectId(userId),
    token: createInviteToken(),
    description,
    expiresAt: resolveInviteExpiryDate(expiryMinutes),
    maxUses: maxUses && maxUses > 0 ? maxUses : undefined,
    usedCount: 0,
  });

  const joinUrl = `${getFrontendUrl()}/groups/join/${invite.token}`;
  const qrCode = await QRCode.toDataURL(joinUrl, { margin: 2, width: 256 });
  const creator = await User.findById(userId).select("_id anonimiId username").lean();

  return {
    inviteLinkId: invite._id.toString(),
    token: invite.token,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses ?? null,
    usedCount: invite.usedCount,
    description: invite.description ?? null,
    createdBy: creator
      ? {
          id: creator._id.toString(),
          anonimiId: creator.anonimiId,
          username: creator.username,
        }
      : null,
    joinUrl,
    qrCode,
  };
};

export const listInviteLinks = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const membership = await getMembership(group._id, userId);
  if (!membership) throw new ForbiddenError("Not a group member");

  const links = await GroupInviteLink.find({ groupId: group._id })
    .populate("createdBy", "anonimiId username")
    .sort({ createdAt: -1 })
    .lean();

  return links.map((link: any) => ({
    inviteLinkId: link._id.toString(),
    token: link.token,
    expiresAt: link.expiresAt,
    revokedAt: link.revokedAt ?? null,
    maxUses: link.maxUses ?? null,
    usedCount: link.usedCount ?? 0,
    description: link.description ?? null,
    createdBy: link.createdBy
      ? {
          id: link.createdBy._id.toString(),
          anonimiId: link.createdBy.anonimiId,
          username: link.createdBy.username,
        }
      : null,
    createdAt: link.createdAt,
    joinUrl: `${getFrontendUrl()}/groups/join/${link.token}`,
  }));
};

export const revokeInviteLink = async (
  groupId: string,
  inviteLinkId: string,
  userId: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new NotFoundError("Group not found");

  const membership = await getMembership(group._id, userId);
  if (!membership) throw new ForbiddenError("Not a group member");

  const invite = await GroupInviteLink.findOne({
    _id: new Types.ObjectId(inviteLinkId),
    groupId: group._id,
  });

  if (!invite) throw new NotFoundError("Invite link not found");
  if (invite.revokedAt) return { message: "Invite link already revoked." };

  invite.revokedAt = new Date();
  invite.revokedBy = new Types.ObjectId(userId);
  await invite.save();

  return { message: "Invite link revoked." };
};

export const joinByInviteToken = async (token: string, userId: string) => {
  const invite = await GroupInviteLink.findOne({ token });
  if (!invite) throw new NotFoundError("Invite link not found");
  if (invite.revokedAt) throw new ForbiddenError("Invite link has been revoked");
  if (invite.expiresAt.getTime() <= Date.now()) throw new ForbiddenError("Invite link has expired");
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new ForbiddenError("Invite link usage limit reached");
  }

  const group = await Group.findById(invite.groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new ForbiddenError("Group has been disbanded");

  const existingMember = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });
  if (existingMember) {
    return {
      status: "already_member",
      groupId: group._id.toString(),
      conversationId: group.conversationId.toString(),
    };
  }

  const creatorMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: invite.createdBy,
  });
  const inviterCanBypassApproval =
    creatorMembership?.role === GroupRole.OWNER || creatorMembership?.role === GroupRole.ADMIN;
  const requiresApproval = !!group.settings?.joinRequestEnabled && !inviterCanBypassApproval;

  if (requiresApproval) {
    const existingPending = await GroupJoinRequest.findOne({
      groupId: group._id,
      userId: new Types.ObjectId(userId),
      status: "pending",
    });

    if (existingPending) {
      return {
        status: "pending_approval",
        requestId: existingPending._id.toString(),
        groupId: group._id.toString(),
      };
    }

    const request = await GroupJoinRequest.create({
      groupId: group._id,
      userId: new Types.ObjectId(userId),
      inviterUserId: invite.createdBy,
      source: "invite_link",
      status: "pending",
      inviteLinkId: invite._id,
    });

    invite.usedCount += 1;
    invite.lastUsedAt = new Date();
    await invite.save();

    return {
      status: "pending_approval",
      requestId: request._id.toString(),
      groupId: group._id.toString(),
    };
  }

  await addMemberToGroup(group._id, group.conversationId, new Types.ObjectId(userId), {
    joinedVia: "invite_link",
    addedByUserId: invite.createdBy,
  });

  const [joinedUser, inviterUser] = await Promise.all([
    User.findById(userId).select("username").lean(),
    User.findById(invite.createdBy).select("username").lean(),
  ]);

  await createGroupSystemMessage(
    group.conversationId,
    new Types.ObjectId(userId),
    `${joinedUser?.username ?? "A member"} joined via invite link${inviterUser?.username ? ` by ${inviterUser.username}` : ""}.`
  );

  invite.usedCount += 1;
  invite.lastUsedAt = new Date();
  await invite.save();

  return {
    status: "joined",
    groupId: group._id.toString(),
    conversationId: group.conversationId.toString(),
  };
};

export const transferOwnership = async (
  groupId: string,
  currentOwnerId: string,
  newOwnerUserId: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");

  const currentMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(currentOwnerId),
  });

  if (!currentMembership || currentMembership.role !== GroupRole.OWNER) {
    throw new ForbiddenError("Only the owner can transfer ownership");
  }

  const newOwnerMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(newOwnerUserId),
  });

  if (!newOwnerMembership) {
    throw new NotFoundError("Target user is not a member of this group");
  }

  const oldOwnerMember = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(currentOwnerId),
  });

  oldOwnerMember!.role = GroupRole.MEMBER;
  await oldOwnerMember!.save();

  newOwnerMembership.role = GroupRole.OWNER;
  await newOwnerMembership.save();

  group.ownerId = new Types.ObjectId(newOwnerUserId);
  await group.save();

  return {
    message: "Ownership transferred",
    newOwnerId: newOwnerUserId,
  };
};

export const disbandGroup = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new ConflictError("Group already disbanded");

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership || membership.role !== GroupRole.OWNER) {
    throw new ForbiddenError("Only the owner can disband the group");
  }

  const owner = await User.findById(userId).select("username").lean();
  const disbandContent = `${owner?.username ?? "The owner"} disbanded the group. Messaging is now disabled.`;
  await createGroupSystemMessage(group.conversationId, new Types.ObjectId(userId), disbandContent);

  group.disbandedAt = new Date();
  await group.save();

  await MessageRequest.deleteMany({ conversationId: group.conversationId });
  await GroupInviteLink.deleteMany({ groupId: group._id });
  await GroupJoinRequest.deleteMany({ groupId: group._id });

  return { message: "Group disbanded" };
};

export const muteMember = async (
  groupId: string,
  requestingUserId: string,
  targetUserId: string,
  durationMinutes: number,
  reason: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");

  const requestingMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(requestingUserId),
  });

  if (!requestingMembership || requestingMembership.role === GroupRole.MEMBER) {
    throw new ForbiddenError("Not authorized to mute members");
  }

  const targetMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(targetUserId),
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found");
  }

  if (targetMembership.role === GroupRole.OWNER) {
    throw new ForbiddenError("Cannot mute the owner");
  }

  if (
    requestingMembership.role === GroupRole.ADMIN &&
    targetMembership.role === GroupRole.ADMIN
  ) {
    throw new ForbiddenError("Cannot mute another admin");
  }

  targetMembership.mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  targetMembership.muteReason = reason;
  await targetMembership.save();

  return {
    message: "Member muted",
    mutedUntil: targetMembership.mutedUntil,
    muteReason: targetMembership.muteReason,
  };
};

export const unmuteMember = async (
  groupId: string,
  requestingUserId: string,
  targetUserId: string
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new NotFoundError("Group not found");

  const requestingMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(requestingUserId),
  });

  if (!requestingMembership || requestingMembership.role === GroupRole.MEMBER) {
    throw new ForbiddenError("Not authorized to unmute members");
  }

  const targetMembership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(targetUserId),
  });

  if (!targetMembership) {
    throw new NotFoundError("Member not found");
  }

  targetMembership.mutedUntil = undefined;
  targetMembership.muteReason = undefined;
  await targetMembership.save();

  return { message: "Member unmuted" };
};

export const getGroupPhotoFallback = async (groupId: string) => {
  const members = await GroupMember.find({ groupId: new Types.ObjectId(groupId) })
    .populate("userId", "profileImage")
    .sort({ joinedAt: 1 })
    .limit(3)
    .lean();

  return members.map((m: any) => ({
    userId: m.userId._id.toString(),
    profileImage: m.userId.profileImage,
  }));
};

export const getGroupInfoByToken = async (token: string) => {
  const invite = await GroupInviteLink.findOne({ token });
  if (!invite) throw new NotFoundError("Invite link not found");
  if (invite.revokedAt) throw new ForbiddenError("Invite link has been revoked");
  if (invite.expiresAt.getTime() <= Date.now()) throw new ForbiddenError("Invite link has expired");
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    throw new ForbiddenError("Invite link usage limit reached");
  }

  const group = await Group.findById(invite.groupId);
  if (!group) throw new NotFoundError("Group not found");
  if (group.disbandedAt) throw new ForbiddenError("Group has been disbanded");

  const memberCount = await GroupMember.countDocuments({ groupId: group._id });

  return {
    groupId: group._id.toString(),
    groupName: group.name,
    groupImage: group.image,
    memberCount,
    description: group.description,
  };
};
