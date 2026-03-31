import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Block } from "../models/block.model";
import { NotFoundError, ConflictError, ForbiddenError } from "../utils/apiError";

export const getBlocks = async (userId: string) => {
  const blocks = await Block.find({
    blockerId: new Types.ObjectId(userId),
    active: true,
  })
    .populate("blockedId", "echoId username profileImage")
    .lean();

  return blocks.map((b: any) => ({
    blockId: b._id.toString(),
    blockedUser: {
      id: b.blockedId._id.toString(),
      echoId: b.blockedId.echoId,
      username: b.blockedId.username,
      profileImage: b.blockedId.profileImage,
    },
    createdAt: b.createdAt,
  }));
};

export const blockUser = async (blockerId: string, targetEchoId: string) => {
  const targetUser = await User.findOne({ echoId: targetEchoId });

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  if (targetUser._id.toString() === blockerId) {
    throw new ForbiddenError("Cannot block yourself");
  }

  const existingBlock = await Block.findOne({
    blockerId: new Types.ObjectId(blockerId),
    blockedId: targetUser._id,
  });

  if (existingBlock?.active) {
    throw new ConflictError("User already blocked");
  }

  if (existingBlock && !existingBlock.active) {
    existingBlock.active = true;
    existingBlock.lastUnblockedAt = undefined;
    await existingBlock.save();

    return {
      blockId: existingBlock._id.toString(),
      message: "User blocked.",
    };
  }

  const block = await Block.create({
    blockerId: new Types.ObjectId(blockerId),
    blockedId: targetUser._id,
    active: true,
  });

  return {
    blockId: block._id.toString(),
    message: "User blocked.",
  };
};

export const unblockUser = async (blockerId: string, blockId: string) => {
  const block = await Block.findOne({
    _id: new Types.ObjectId(blockId),
    blockerId: new Types.ObjectId(blockerId),
    active: true,
  });

  if (!block) {
    throw new NotFoundError("Block not found");
  }

  block.active = false;
  block.lastUnblockedAt = new Date();
  await block.save();

  return {
    message: "User unblocked.",
  };
};
