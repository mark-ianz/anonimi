import { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await listNotifications(req.user!._id.toString(), limit, cursor);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const readNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const result = await markNotificationRead(req.user!._id.toString(), notificationId);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const readAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await markAllNotificationsRead(req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
