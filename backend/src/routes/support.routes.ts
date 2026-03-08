import { Router } from "express";
import * as supportController from "../controllers/support.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createTicketSchema, ticketParamsSchema, replyToTicketSchema } from "../validators/support.validator";

const router = Router();

router.post("/tickets", authenticate, validate(createTicketSchema), supportController.createTicket);
router.get("/tickets", authenticate, supportController.getTickets);
router.get("/tickets/:ticketId", authenticate, validate(ticketParamsSchema), supportController.getTicket);
router.post("/tickets/:ticketId/messages", authenticate, validate(ticketParamsSchema), validate(replyToTicketSchema), supportController.replyToTicket);

export default router;
