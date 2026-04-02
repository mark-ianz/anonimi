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
  adminDeleteRequestParamsSchema,
  createDeleteRequestSchema,
} from "../validators/admin.validator";
import { replyToTicketSchema } from "../validators/support.validator";

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN, UserRole.SUPPORT_STAFF));

router.get("/users", adminController.getUsers);
router.get("/users/:userId", validate(adminUserParamsSchema), adminController.getUserById);
router.post(
  "/users/:userId/warn",
  validate(adminUserParamsSchema),
  validate(warnUserSchema),
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  adminController.warnUser
);
router.post(
  "/users/:userId/ban",
  validate(adminUserParamsSchema),
  validate(banUserSchema),
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  adminController.banUser
);
router.post(
  "/users/:userId/unban",
  validate(adminUserParamsSchema),
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  adminController.unbanUser
);
router.post(
  "/users/:userId/delete-request",
  validate(adminUserParamsSchema),
  validate(createDeleteRequestSchema),
  requireRole(UserRole.MODERATOR),
  adminController.requestUserDeletion
);
router.delete(
  "/users/:userId",
  validate(adminUserParamsSchema),
  requireRole(UserRole.SUPER_ADMIN),
  adminController.deleteUser
);
router.patch("/users/:userId/role", validate(adminUserParamsSchema), validate(changeRoleSchema), requireRole(UserRole.SUPER_ADMIN), adminController.changeUserRole);

router.get("/reports", adminController.getReports);
router.get("/reports/:reportId", validate(reportParamsSchema), adminController.getReportById);
router.patch("/reports/:reportId/claim", validate(reportParamsSchema), adminController.claimReport);
router.patch("/reports/:reportId/resolve", validate(reportParamsSchema), validate(resolveReportSchema), adminController.resolveReport);
router.patch("/reports/:reportId/dismiss", validate(reportParamsSchema), adminController.dismissReport);

router.get("/support/tickets", adminController.getAdminTickets);
router.get("/support/tickets/:ticketId", adminController.getAdminTicketById);
router.patch("/support/tickets/:ticketId/assign", validate(updateTicketSchema), adminController.assignTicket);
router.patch("/support/tickets/:ticketId/status", validate(updateTicketSchema), adminController.updateTicketStatus);
router.post("/support/tickets/:ticketId/messages", validate(replyToTicketSchema), adminController.replyToTicketAsStaff);

router.get("/groups", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getGroups);
router.get(
  "/groups/:groupId",
  validate(adminGroupParamsSchema),
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  adminController.getGroupById
);
router.delete("/groups/:groupId", validate(adminGroupParamsSchema), requireRole(UserRole.SUPER_ADMIN), adminController.deleteGroup);

router.get(
  "/conversations/:convId/messages",
  validate(adminConversationParamsSchema),
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN),
  adminController.getConversationMessages
);

router.get("/bans", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getBans);
router.get("/bans/history", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getBanHistory);

router.get(
  "/analytics/overview",
  requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN, UserRole.SUPPORT_STAFF),
  adminController.getAnalytics
);
router.get("/analytics/users", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getAnalyticsUsers);
router.get("/analytics/messages", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getAnalyticsMessages);

router.get("/warnings", adminController.getWarnings);

router.get("/logs", requireRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN), adminController.getAdminLogs);

router.get("/approvals/deletions", requireRole(UserRole.SUPER_ADMIN), adminController.getDeletionRequests);
router.patch(
  "/approvals/deletions/:requestId/approve",
  validate(adminDeleteRequestParamsSchema),
  requireRole(UserRole.SUPER_ADMIN),
  adminController.approveDeletionRequest
);
router.patch(
  "/approvals/deletions/:requestId/reject",
  validate(adminDeleteRequestParamsSchema),
  requireRole(UserRole.SUPER_ADMIN),
  adminController.rejectDeletionRequest
);

export default router;
