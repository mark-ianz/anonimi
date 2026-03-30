import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  listNotificationsSchema,
  notificationParamsSchema,
} from "../validators/notification.validator";

const router = Router();

router.get("/", authenticate, validate(listNotificationsSchema), notificationController.getNotifications);
router.patch("/read-all", authenticate, notificationController.readAllNotifications);
router.patch("/:notificationId/read", authenticate, validate(notificationParamsSchema), notificationController.readNotification);

export default router;
