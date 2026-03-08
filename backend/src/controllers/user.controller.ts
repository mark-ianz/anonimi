import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";

export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, limit, cursor } = req.query;
    const result = await userService.searchUsers(
      q as string,
      limit ? parseInt(limit as string) : 10,
      cursor as string
    );
    apiPaginated(res, result.users, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit: parseInt(limit as string) || 10,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByEchoId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { echoId } = req.params;
    const user = await userService.getUserByEchoId(echoId, req.user!._id.toString());
    apiSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
