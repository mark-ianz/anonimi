import { Router } from "express";
import * as conversationController from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { getMessagesSchema, sendMessageSchema, messageParamsSchema } from "../validators/message.validator";

const router = Router();

// GET /requests must appear before /:conversationId to avoid route collision
router.get("/requests", authenticate, conversationController.getConversationRequests);
router.post("/", authenticate, conversationController.createOrGetConversation);
router.get("/", authenticate, conversationController.getConversations);
router.get("/:conversationId", authenticate, conversationController.getConversation);

router.get("/messages", authenticate, validate(getMessagesSchema), conversationController.getMessages);
router.post("/messages", authenticate, validate(sendMessageSchema), conversationController.sendMessage);
router.delete("/messages/:messageId/for-me", authenticate, validate(messageParamsSchema), conversationController.deleteMessageForMe);
router.post("/messages/:messageId/unsend", authenticate, validate(messageParamsSchema), conversationController.unsendMessage);
router.post("/messages/read", authenticate, conversationController.markMessagesAsRead);

export default router;
