import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Block } from "../models/block.model";
import { Contact } from "../models/contact.model";
import { NotFoundError } from "../utils/apiError";
import { OnlineStatus } from "../types/enums";

interface SearchResult {
  id: string;
  anonimiId: string;
  username: string;
  profileImage: string | null;
  onlineStatus: string;
  isTemporary: boolean;
}

const GENERIC_SEARCH_TOKENS = new Set([
  "aid",
  "aid_",
  "id",
  "anonimi",
  "user",
  "users",
]);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async (
  query: string,
  limit: number = 10,
  cursor?: string
): Promise<{ users: SearchResult[]; nextCursor?: string }> => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return { users: [] };
  }

  const hasAnonimiPrefix = normalized.startsWith("aid");
  const anonimiSuffix = normalized.replace(/^aid_?/, "").replace(/[^a-z0-9]/gi, "");
  const isGeneric =
    GENERIC_SEARCH_TOKENS.has(normalized) ||
    (hasAnonimiPrefix && anonimiSuffix.length < 3);

  // Prevent broad wildcard-like queries (e.g. "aid") from listing everyone.
  if (isGeneric) {
    return { users: [] };
  }

  const escapedQuery = escapeRegex(normalized);
  const usernameRegex = new RegExp(escapedQuery, "i");

  const anonimiRegex = hasAnonimiPrefix
    ? new RegExp(`^aid_${escapeRegex(anonimiSuffix)}`, "i")
    : new RegExp(escapedQuery, "i");
  const orConditions = [{ username: usernameRegex }, { anonimiId: anonimiRegex }];

  const searchQuery = {
    $or: orConditions,
    isTemporary: { $ne: true },
  };

  const users = await User.find(searchQuery)
    .select("anonimiId username profileImage onlineStatus isTemporary")
    .limit(limit + 1)
    .sort({ username: 1 })
    .lean();

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : undefined;

  return {
    users: data.map((u) => ({
      id: u._id.toString(),
      anonimiId: u.anonimiId,
      username: u.username,
      profileImage: u.profileImage,
      onlineStatus: u.onlineStatus,
      isTemporary: !!u.isTemporary,
    })),
    nextCursor,
  };
};

export const getUserByAnonimiId = async (
  anonimiId: string,
  currentUserId: string
) => {
  const user = await User.findOne({ anonimiId }).select(
    "anonimiId username profileImage onlineStatus lastSeen createdAt isTemporary"
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const currentUserObjectId = new Types.ObjectId(currentUserId);
  const relationshipContacts = await Contact.find({
    $or: [
      {
        userId: currentUserObjectId,
        contactId: user._id,
      },
      {
        userId: user._id,
        contactId: currentUserObjectId,
      },
    ],
  })
    .select("userId contactId status nickname")
    .lean();

  const directRelationship = relationshipContacts.find(
    (contact) =>
      contact.userId.toString() === currentUserId &&
      contact.contactId.toString() === user._id.toString()
  );
  const reverseRelationship = relationshipContacts.find(
    (contact) =>
      contact.userId.toString() === user._id.toString() &&
      contact.contactId.toString() === currentUserId
  );

  const isContact = directRelationship?.status === "accepted";
  const pendingOutgoingRequestId =
    directRelationship?.status === "pending" ? directRelationship._id.toString() : null;
  const pendingIncomingRequestId =
    reverseRelationship?.status === "pending" ? reverseRelationship._id.toString() : null;

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
    anonimiId: user.anonimiId,
    username: user.username,
    profileImage: user.profileImage,
    onlineStatus: user.onlineStatus,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    isTemporary: !!user.isTemporary,
    isContact,
    pendingOutgoingRequestId,
    pendingIncomingRequestId,
    isBlocked: !!isBlocked,
    contactNickname: isContact ? directRelationship?.nickname || null : null,
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
