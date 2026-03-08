import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/requireRole.middleware";
import { UserRole } from "../types/enums";
import { validate } from "../middleware/validate.middleware";
import {
  adminUserParamsSchema,
  banUserSchema,
  warnUserSchema,
  changeRoleSchema,
  resolveReportSchema,
  adminConversationParamsSchema,
  reportParamsSchema,
  adminGroupParamsSchema,
  updateTicketSchema,
} from "../validators/admin.validator";
import { replyToTicketSchema } from "../validators/support.validator";

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN, UserRole.SUPPORT_STAFF));

router.get("/users", adminController.getUsers);
router.get("/users/:userId", validate(adminUserParamsSchema), adminController.getUserById);
router.post("/users/:userId/warn", validate(adminUserParamsSchema), validate(warnUserSchema), adminController.warnUser);
router.post("/users/:userId/ban", validate(adminUserParamsSchema), validate(banUserSchema), adminController.banUser);
router.post("/users/:userId/unban", validate(adminUserParamsSchema), adminController.unbanUser);
router.patch("/users/:userId/role", validate(adminUserParamsSchema), validate(changeRoleSchema), requireRole(UserRole.SUPER_ADMIN), adminController.changeUserRole);

router.get("/reports", adminController.getReports);
router.get("/reports/:reportId", validate(reportParamsSchema), adminController.getReportById);
router.patch("/reports/:reportId/resolve", validate(reportParamsSchema), validate(resolveReportSchema), adminController.resolveReport);
router.patch("/reports/:reportId/dismiss", validate(reportParamsSchema), adminController.dismissReport);

router.get("/support/tickets", adminController.getAdminTickets);
router.get("/support/tickets/:ticketId", adminController.getAdminTicketById);
router.patch("/support/tickets/:ticketId/assign", validate(updateTicketSchema), adminController.assignTicket);
router.patch("/support/tickets/:ticketId/status", validate(updateTicketSchema), adminController.updateTicketStatus);
router.post("/support/tickets/:ticketId/messages", validate(replyToTicketSchema), adminController.replyToTicketAsStaff);

router.get("/groups", adminController.getGroups);
router.get("/groups/:groupId", validate(adminGroupParamsSchema), adminController.getGroupById);
router.delete("/groups/:groupId", validate(adminGroupParamsSchema), requireRole(UserRole.SUPER_ADMIN), adminController.deleteGroup);

router.get("/conversations/:convId/messages", validate(adminConversationParamsSchema), adminController.getConversationMessages);

router.get("/bans", adminController.getBans);

router.get("/analytics/overview", adminController.getAnalytics);

router.get("/logs", requireRole(UserRole.SUPER_ADMIN), adminController.getAdminLogs);

export default router;
