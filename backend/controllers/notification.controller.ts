import { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markMessageNotificationsReadByConversation,
  markNotificationRead,
} from "../services/notification.service";
import {
  getVapidPublicKey,
  hasActivePushSubscriptions,
  removePushSubscription,
  sendPushToUser,
  upsertPushSubscription,
} from "../services/push.service";

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

export const readConversationMessageNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const result = await markMessageNotificationsReadByConversation(
      req.user!._id.toString(),
      conversationId
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const removeNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const result = await deleteNotification(req.user!._id.toString(), notificationId);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getPushStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enabled = await hasActivePushSubscriptions(req.user!._id.toString());
    apiSuccess(res, { enabled });
  } catch (error) {
    next(error);
  }
};

export const getPushPublicKey = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    apiSuccess(res, { publicKey: getVapidPublicKey() });
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { endpoint, keys, expirationTime, userAgent } = req.body;
    await upsertPushSubscription({
      userId: req.user!._id.toString(),
      endpoint,
      keys,
      expirationTime,
      userAgent: userAgent ?? req.get("user-agent") ?? undefined,
    });
    apiSuccess(res, { enabled: true });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { endpoint } = req.body ?? {};
    await removePushSubscription({
      userId: req.user!._id.toString(),
      endpoint,
    });
    apiSuccess(res, { enabled: false });
  } catch (error) {
    next(error);
  }
};

export const testPush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await sendPushToUser(req.user!._id.toString(), {
      title: "anonimi Test",
      body: "This is a test push notification.",
      data: { href: "/chat" },
    });
    apiSuccess(res, { sent: true });
  } catch (error) {
    next(error);
  }
};
