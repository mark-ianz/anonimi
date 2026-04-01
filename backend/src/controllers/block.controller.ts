import { Request, Response, NextFunction } from "express";
import * as blockService from "../services/block.service";
import { apiSuccess } from "../utils/apiResponse";

export const getBlocks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const blocks = await blockService.getBlocks(req.user!._id.toString());
    apiSuccess(res, blocks);
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetAnonimiId } = req.body;
    const result = await blockService.blockUser(
      req.user!._id.toString(),
      targetAnonimiId
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { blockId } = req.params;
    const result = await blockService.unblockUser(req.user!._id.toString(), blockId);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
