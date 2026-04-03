import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  conversationNotificationParamsSchema,
  listNotificationsSchema,
  notificationParamsSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "../validators/notification.validator";

const router = Router();

router.get("/", authenticate, validate(listNotificationsSchema), notificationController.getNotifications);
router.get("/push/status", authenticate, notificationController.getPushStatus);
router.get("/push/public-key", authenticate, notificationController.getPushPublicKey);
router.post("/push/test", authenticate, notificationController.testPush);
router.post(
  "/push/subscribe",
  authenticate,
  validate(pushSubscribeSchema),
  notificationController.subscribePush
);
router.post(
  "/push/unsubscribe",
  authenticate,
  validate(pushUnsubscribeSchema),
  notificationController.unsubscribePush
);
router.patch(
  "/messages/read-by-conversation/:conversationId",
  authenticate,
  validate(conversationNotificationParamsSchema),
  notificationController.readConversationMessageNotifications
);
router.patch("/read-all", authenticate, notificationController.readAllNotifications);
router.patch("/:notificationId/read", authenticate, validate(notificationParamsSchema), notificationController.readNotification);
router.delete("/:notificationId", authenticate, validate(notificationParamsSchema), notificationController.removeNotification);

export default router;
