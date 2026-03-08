import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  sendContactRequestSchema,
  contactParamsSchema,
  updateNicknameSchema,
} from "../validators/contact.validator";

const router = Router();

router.get("/", authenticate, contactController.getContacts);
router.get("/requests", authenticate, contactController.getIncomingRequests);
router.post("/request", authenticate, validate(sendContactRequestSchema), contactController.sendContactRequest);
router.patch("/:contactId/accept", authenticate, validate(contactParamsSchema), contactController.acceptContactRequest);
router.patch("/:contactId/decline", authenticate, validate(contactParamsSchema), contactController.declineContactRequest);
router.delete("/:contactId", authenticate, validate(contactParamsSchema), contactController.removeContact);
router.patch("/:contactId/nickname", authenticate, validate(contactParamsSchema), validate(updateNicknameSchema), contactController.updateNickname);

export default router;
