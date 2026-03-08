import { Router } from "express";
import * as messageController from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { getMessagesSchema, sendMessageSchema, messageParamsSchema } from "../validators/message.validator";

const router = Router();

router.get("/", authenticate, validate(getMessagesSchema), messageController.getMessages);
router.post("/", authenticate, validate(sendMessageSchema), messageController.sendMessage);
router.delete("/:messageId/for-me", authenticate, validate(messageParamsSchema), messageController.deleteMessageForMe);
router.post("/:messageId/unsend", authenticate, validate(messageParamsSchema), messageController.unsendMessage);

export default router;
