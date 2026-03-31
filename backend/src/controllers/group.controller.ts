import { Request, Response, NextFunction } from "express";
import * as groupService from "../services/group.service";
import { apiSuccess } from "../utils/apiResponse";

export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, image, memberEchoIds, settings } = req.body;
    const result = await groupService.createGroup(
      req.user!._id.toString(),
      name,
      memberEchoIds,
      image,
      description,
      settings
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
    const { name, description, image, settings } = req.body;
    const group = await groupService.updateGroup(groupId, req.user!._id.toString(), {
      name,
      description,
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
    const members = await groupService.getGroupMembers(groupId, req.user!._id.toString());
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

export const createJoinRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await groupService.createJoinRequest(groupId, req.user!._id.toString());
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const listJoinRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await groupService.listJoinRequests(groupId, req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const decideJoinRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, requestId } = req.params;
    const { action } = req.body;
    const result = await groupService.decideJoinRequest(
      groupId,
      requestId,
      req.user!._id.toString(),
      action
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createInviteLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { expiryMinutes, maxUses, description } = req.body;
    const result = await groupService.createInviteLink(
      groupId,
      req.user!._id.toString(),
      expiryMinutes,
      maxUses,
      description
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const listInviteLinks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await groupService.listInviteLinks(groupId, req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const revokeInviteLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, inviteLinkId } = req.params;
    const result = await groupService.revokeInviteLink(
      groupId,
      inviteLinkId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const joinByInviteToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const result = await groupService.joinByInviteToken(token, req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const transferOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { userId: newOwnerUserId } = req.body;
    const result = await groupService.transferOwnership(
      groupId,
      req.user!._id.toString(),
      newOwnerUserId
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const disbandGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await groupService.disbandGroup(groupId, req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const muteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    const { durationMinutes } = req.body;
    const result = await groupService.muteMember(
      groupId,
      req.user!._id.toString(),
      userId,
      durationMinutes || 60
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const unmuteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    const result = await groupService.unmuteMember(
      groupId,
      req.user!._id.toString(),
      userId
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getGroupInfoByToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const result = await groupService.getGroupInfoByToken(token);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
