import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  conversationNotificationParamsSchema,
  listNotificationsSchema,
  notificationParamsSchema,
} from "../validators/notification.validator";

const router = Router();

router.get("/", authenticate, validate(listNotificationsSchema), notificationController.getNotifications);
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
