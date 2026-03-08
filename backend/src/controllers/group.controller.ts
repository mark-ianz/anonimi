import { Request, Response, NextFunction } from "express";
import * as groupService from "../services/group.service";
import { apiSuccess } from "../utils/apiResponse";

export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, image, memberEchoIds } = req.body;
    const result = await groupService.createGroup(
      req.user!._id.toString(),
      name,
      memberEchoIds,
      image
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const group = await groupService.getGroup(groupId, req.user!._id.toString());
    apiSuccess(res, group);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { name, image, settings } = req.body;
    const group = await groupService.updateGroup(groupId, req.user!._id.toString(), {
      name,
      image,
      settings,
    });
    apiSuccess(res, group);
  } catch (error) {
    next(error);
  }
};

export const getGroupMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const members = await groupService.getGroupMembers(groupId);
    apiSuccess(res, members);
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { memberEchoIds } = req.body;
    const result = await groupService.addMembers(
      groupId,
      req.user!._id.toString(),
      memberEchoIds
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    await groupService.removeMember(groupId, req.user!._id.toString(), userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changeRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const result = await groupService.changeRole(
      groupId,
      req.user!._id.toString(),
      userId,
      role
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await groupService.leaveGroup(groupId, req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const setNickname = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { nickname } = req.body;
    const result = await groupService.setNickname(
      groupId,
      req.user!._id.toString(),
      nickname
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
