import { Types } from "mongoose";
import { Conversation } from "../models/conversation.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { User } from "../models/user.model";
import { Contact } from "../models/contact.model";
import { MessageRequest } from "../models/messageRequest.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { GroupRole } from "../types/enums";

export const createGroup = async (
  ownerId: string,
  name: string,
  memberEchoIds: string[],
  image?: string
) => {
  const owner = await User.findOne({ echoId: ownerId.split("_")[1] ? ownerId : undefined });
  const actualOwnerId = ownerId;

  const participants = [new Types.ObjectId(actualOwnerId)];

  const memberUsers = await User.find({
    echoId: { $in: memberEchoIds },
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
    name,
    image,
    ownerId: new Types.ObjectId(actualOwnerId),
    settings: {
      joinRequestEnabled: false,
    },
  });

  await GroupMember.create({
    groupId: group._id,
    userId: new Types.ObjectId(actualOwnerId),
    role: GroupRole.OWNER,
    joinedAt: new Date(),
  });

  const memberData = [
    {
      userId: actualOwnerId,
      echoId: owner?.echoId || "",
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
      joinedAt: isContact ? new Date() : undefined,
    });

    memberData.push({
      userId: user._id.toString(),
      echoId: user.echoId,
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

  return {
    groupId: group._id.toString(),
    conversationId: conversation._id.toString(),
    name,
    ownerId: actualOwnerId,
    members: memberData,
  };
};

export const getGroup = async (groupId: string, userId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  const memberCount = await GroupMember.countDocuments({
    groupId: group._id,
  });

  return {
    id: group._id.toString(),
    conversationId: group.conversationId.toString(),
    name: group.name,
    image: group.image,
    ownerId: group.ownerId.toString(),
    settings: group.settings,
    memberCount,
    myRole: membership?.role,
    createdAt: group.createdAt,
  };
};

export const updateGroup = async (
  groupId: string,
  userId: string,
  updates: { name?: string; image?: string; settings?: { joinRequestEnabled: boolean } }
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
    throw new ForbiddenError("Not authorized to update group");
  }

  if (updates.name) group.name = updates.name;
  if (updates.image) group.image = updates.image;
  if (updates.settings) group.settings = updates.settings;

  await group.save();

  return group;
};

export const getGroupMembers = async (groupId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const members = await GroupMember.find({ groupId: group._id })
    .populate("userId", "echoId username profileImage")
    .sort({ role: 1, joinedAt: 1 })
    .lean();

  return members.map((m: any) => ({
    userId: m.userId._id.toString(),
    echoId: m.userId.echoId,
    username: m.userId.username,
    profileImage: m.userId.profileImage,
    role: m.role,
    nickname: m.nickname,
    joinedAt: m.joinedAt,
  }));
};

export const addMembers = async (
  groupId: string,
  userId: string,
  memberEchoIds: string[]
) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (!membership || (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN)) {
    throw new ForbiddenError("Not authorized to add members");
  }

  const newMembers = await User.find({ echoId: { $in: memberEchoIds } });

  const added: { echoId: string; status: string }[] = [];
  const invited: { echoId: string; status: string }[] = [];

  for (const user of newMembers) {
    const existingMember = await GroupMember.findOne({
      groupId: group._id,
      userId: user._id,
    });

    if (existingMember) continue;

    const isContact = await Contact.findOne({
      $or: [
        { userId, contactId: user._id, status: "accepted" },
        { userId: user._id, contactId: user, status: "accepted" },
      ],
    });

    await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      role: GroupRole.MEMBER,
      joinedAt: isContact ? new Date() : undefined,
    });

    await Conversation.updateOne(
      { _id: group.conversationId },
      { $addToSet: { participants: user._id } }
    );

    if (isContact) {
      added.push({ echoId: user.echoId, status: "joined" });
    } else {
      invited.push({ echoId: user.echoId, status: "invited" });
    }
  }

  return { added, invited };
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

  if (membership.role === GroupRole.OWNER) {
    const admins = await GroupMember.find({
      groupId: group._id,
      role: GroupRole.ADMIN,
    });

    if (admins.length > 0) {
      admins[0].role = GroupRole.OWNER;
      await admins[0].save();

      await GroupMember.deleteOne({ _id: membership._id });

      return {
        message: "You have left the group.",
        ownershipTransferred: true,
        newOwnerId: admins[0].userId.toString(),
      };
    }
  }

  await GroupMember.deleteOne({ _id: membership._id });

  await Conversation.updateOne(
    { _id: group.conversationId },
    { $pull: { participants: new Types.ObjectId(userId) } }
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
  const membership = await GroupMember.findOneAndUpdate(
    { groupId: new Types.ObjectId(groupId), userId: new Types.ObjectId(userId) },
    { nickname },
    { new: true }
  );

  if (!membership) {
    throw new NotFoundError("Member not found");
  }

  return membership;
};
