import { Types } from "mongoose";
import { User } from "../models/user.model";
import { RefreshToken } from "../models/refreshToken.model";
import { Contact } from "../models/contact.model";
import { Block } from "../models/block.model";
import { GroupMember } from "../models/groupMember.model";
import { logger } from "../utils/logger";

const DEFAULT_INTERVAL_MS = 60_000;

const cleanupTemporaryAccounts = async (ids: Types.ObjectId[]) => {
  if (!ids.length) return;

  await RefreshToken.deleteMany({ userId: { $in: ids } });
  await Contact.deleteMany({
    $or: [{ userId: { $in: ids } }, { contactId: { $in: ids } }],
  });
  await Block.deleteMany({
    $or: [{ blockerId: { $in: ids } }, { blockedId: { $in: ids } }],
  });
  await GroupMember.deleteMany({ userId: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
};

const expireTemporaryAccounts = async () => {
  const now = new Date();
  const expired = await User.find({
    isTemporary: true,
    tempExpiresAt: { $lte: now },
  })
    .select("_id")
    .lean();

  await cleanupTemporaryAccounts(expired.map((user) => user._id));
};

export const removeTemporaryAccount = async (userId: string) => {
  const id = new Types.ObjectId(userId);
  await cleanupTemporaryAccounts([id]);
};

export const startTemporaryAccountCleanupJob = (intervalMs: number = DEFAULT_INTERVAL_MS) => {
  expireTemporaryAccounts().catch((error) => {
    logger.error({ err: error }, "Failed to expire temporary accounts");
  });

  setInterval(() => {
    expireTemporaryAccounts().catch((error) => {
      logger.error({ err: error }, "Failed to expire temporary accounts");
    });
  }, intervalMs);
};
