import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Block } from "../models/block.model";
import { Contact } from "../models/contact.model";
import { NotFoundError, ForbiddenError } from "../utils/apiError";
import { OnlineStatus } from "../types/enums";

interface SearchResult {
  id: string;
  echoId: string;
  username: string;
  profileImage: string | null;
  onlineStatus: string;
}

export const searchUsers = async (
  query: string,
  limit: number = 10,
  cursor?: string
): Promise<{ users: SearchResult[]; nextCursor?: string }> => {
  const searchQuery = {
    $or: [
      { username: { $regex: query, $options: "i" } },
      { echoId: { $regex: query, $options: "i" } },
    ],
  };

  const users = await User.find(searchQuery)
    .select("echoId username profileImage onlineStatus")
    .limit(limit + 1)
    .sort({ username: 1 })
    .lean();

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : undefined;

  return {
    users: data.map((u) => ({
      id: u._id.toString(),
      echoId: u.echoId,
      username: u.username,
      profileImage: u.profileImage,
      onlineStatus: u.onlineStatus,
    })),
    nextCursor,
  };
};

export const getUserByEchoId = async (
  echoId: string,
  currentUserId: string
) => {
  const user = await User.findOne({ echoId }).select(
    "echoId username profileImage onlineStatus lastSeen createdAt"
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isContact = await Contact.findOne({
    userId: currentUserId,
    contactId: user._id,
    status: "accepted",
  });

  const isBlocked = await Block.findOne({
    blockerId: currentUserId,
    blockedId: user._id,
    active: true,
  });

  const blockedBy = await Block.findOne({
    blockerId: user._id,
    blockedId: currentUserId,
    active: true,
  });

  return {
    id: user._id.toString(),
    echoId: user.echoId,
    username: user.username,
    profileImage: user.profileImage,
    onlineStatus: user.onlineStatus,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    isContact: !!isContact,
    isBlocked: !!isBlocked,
    contactNickname: isContact?.nickname || null,
    isBlockedBy: !!blockedBy,
  };
};

export const getOnlineUsers = async (userIds: string[]): Promise<string[]> => {
  const users = await User.find({
    _id: { $in: userIds },
    onlineStatus: OnlineStatus.ONLINE,
  }).select("_id");

  return users.map((u) => u._id.toString());
};

export const isUserBlocked = async (
  blockerId: string,
  blockedId: string
): Promise<boolean> => {
  const block = await Block.findOne({
    blockerId: new Types.ObjectId(blockerId),
    blockedId: new Types.ObjectId(blockedId),
    active: true,
  });

  return !!block;
};
