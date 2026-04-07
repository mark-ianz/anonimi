import { Message } from "../models/message.model";
import { emitToConversation } from "./notification.service";
import { logger } from "../utils/logger";

const DEFAULT_INTERVAL_MS = 10000;

const expireStealthMessages = async () => {
  const now = new Date();
  const expired = await Message.find({
    isStealth: true,
    stealthExpiredAt: { $exists: false },
    stealthExpiresAt: { $lte: now },
  })
    .select("_id conversationId contentLength stealthExpiresAt")
    .lean();

  if (!expired.length) return;

  const ids = expired.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        stealthExpiredAt: now,
        content: null,
      },
      $unset: {
        stealthContentCipher: "",
        stealthContentIv: "",
        stealthContentTag: "",
      },
    }
  );

  expired.forEach((message) => {
    emitToConversation(message.conversationId.toString(), "message:stealth:expired", {
      conversationId: message.conversationId.toString(),
      messageId: message._id.toString(),
      stealthExpiredAt: now.toISOString(),
      stealthContentLength: message.contentLength ?? 0,
    });
  });
};

export const startStealthExpiryJob = (intervalMs: number = DEFAULT_INTERVAL_MS) => {
  expireStealthMessages().catch((error) => {
    logger.error({ err: error }, "Failed to process stealth expirations");
  });

  setInterval(() => {
    expireStealthMessages().catch((error) => {
      logger.error({ err: error }, "Failed to process stealth expirations");
    });
  }, intervalMs);
};
