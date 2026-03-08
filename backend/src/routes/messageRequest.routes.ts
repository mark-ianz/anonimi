import { Router } from "express";
import * as messageRequestController from "../controllers/messageRequest.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, messageRequestController.getMessageRequests);
router.patch("/:requestId/accept", authenticate, messageRequestController.acceptMessageRequest);
router.patch("/:requestId/ignore", authenticate, messageRequestController.ignoreMessageRequest);

export default router;
