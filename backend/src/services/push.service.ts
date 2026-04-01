import webpush from "web-push";
import { Types } from "mongoose";
import { env } from "../config/env";
import { PushSubscription } from "../models/pushSubscription.model";
import { logger } from "../utils/logger";

const toBase64Key = (value: string | undefined): string => (value ?? "").trim();

const isVapidConfigured = (): boolean => {
  return !!(toBase64Key(env.VAPID_PUBLIC_KEY) && toBase64Key(env.VAPID_PRIVATE_KEY));
};

let vapidInitialized = false;

const ensureVapidConfigured = (): boolean => {
  if (!isVapidConfigured()) return false;
  if (vapidInitialized) return true;

  const subject = env.VAPID_SUBJECT?.trim() || env.FRONTEND_URL;
  webpush.setVapidDetails(subject, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidInitialized = true;
  return true;
};

export const getVapidPublicKey = (): string => env.VAPID_PUBLIC_KEY;

export const upsertPushSubscription = async (input: {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
  userAgent?: string;
}) => {
  const now = new Date();
  const update = {
    userId: new Types.ObjectId(input.userId),
    endpoint: input.endpoint,
    keys: input.keys,
    expirationTime: input.expirationTime ?? undefined,
    userAgent: input.userAgent,
    revokedAt: undefined,
    lastUsedAt: now,
  };

  const doc = await PushSubscription.findOneAndUpdate(
    { endpoint: input.endpoint },
    { $set: update },
    { upsert: true, new: true }
  );

  return doc;
};

export const removePushSubscription = async (input: {
  userId: string;
  endpoint?: string;
}) => {
  const userObjectId = new Types.ObjectId(input.userId);

  if (input.endpoint) {
    await PushSubscription.deleteOne({ userId: userObjectId, endpoint: input.endpoint });
    return;
  }

  await PushSubscription.deleteMany({ userId: userObjectId });
};

export const hasActivePushSubscriptions = async (userId: string): Promise<boolean> => {
  const count = await PushSubscription.countDocuments({
    userId: new Types.ObjectId(userId),
    revokedAt: { $exists: false },
  });
  return count > 0;
};

const markSubscriptionRevoked = async (endpoint: string) => {
  await PushSubscription.updateOne(
    { endpoint },
    { $set: { revokedAt: new Date() } }
  );
};

export const sendPushToUser = async (userId: string, payload: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) => {
  if (!ensureVapidConfigured()) {
    logger.warn("VAPID not configured; push skipped");
    return;
  }

  const subs = await PushSubscription.find({
    userId: new Types.ObjectId(userId),
    revokedAt: { $exists: false },
  }).lean();

  if (subs.length === 0) {
    logger.warn({ userId }, "No active push subscriptions");
    return;
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
            expirationTime: sub.expirationTime ?? undefined,
          },
          body
        );
        await PushSubscription.updateOne(
          { endpoint: sub.endpoint },
          { $set: { lastUsedAt: new Date() } }
        );
      } catch (error: any) {
        const statusCode = error?.statusCode as number | undefined;
        if (statusCode === 404 || statusCode === 410) {
          await markSubscriptionRevoked(sub.endpoint);
          return;
        }
        logger.error(error);
      }
    })
  );
};
