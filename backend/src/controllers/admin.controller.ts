import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.q as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getUsers(search, status, limit, cursor);
    apiPaginated(res, result.users, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await adminService.getUserById(userId);
    apiSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const warnUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const message = (req.body as any).message;
    const result = await adminService.warnUser(
      req.user!._id.toString(),
      userId,
      message,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const reason = (req.body as any).reason;
    const type = (req.body as any).type;
    const expiresInDays = (req.body as any).expiresInDays;
    const result = await adminService.banUser(
      req.user!._id.toString(),
      userId,
      reason,
      type,
      expiresInDays,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await adminService.unbanUser(
      req.user!._id.toString(),
      userId,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const role = (req.body as any).role;
    const result = await adminService.changeUserRole(
      req.user!._id.toString(),
      userId,
      role
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getReports(status, targetType, limit, cursor);
    apiPaginated(res, result.reports, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const report = await adminService.getReportById(reportId);
    apiSuccess(res, report);
  } catch (error) {
    next(error);
  }
};

export const claimReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const result = await adminService.claimReport(
      req.user!._id.toString(),
      reportId
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const resolution = (req.body as any).resolution;
    const resolutionNotes = (req.body as any).resolutionNotes;
    const reporterNote = (req.body as any).reporterNote;
    const result = await adminService.resolveReport(
      req.user!._id.toString(),
      reportId,
      resolution,
      resolutionNotes,
      reporterNote,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const dismissReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const result = await adminService.dismissReport(
      req.user!._id.toString(),
      reportId,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getAdminTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getAdminTickets(status, limit, cursor);
    apiPaginated(res, result.tickets, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const ticket = await adminService.getAdminTicketById(ticketId);
    apiSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const assignedTo = (req.body as any).assignedTo ?? req.user!._id.toString();
    const result = await adminService.assignTicket(
      req.user!._id.toString(),
      ticketId,
      assignedTo
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const status = (req.body as any).status;
    const result = await adminService.updateTicketStatus(
      req.user!._id.toString(),
      ticketId,
      status
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const replyToTicketAsStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content, mediaUrl, type } = req.body as any;
    const result = await adminService.replyToTicketAsStaff(
      req.user!._id.toString(),
      ticketId,
      content,
      mediaUrl,
      type
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getGroups(search, limit, cursor);
    apiPaginated(res, result.groups, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const group = await adminService.getGroupById(groupId);
    apiSuccess(res, group);
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const result = await adminService.deleteGroup(
      req.user!._id.toString(),
      groupId,
      req.ip || undefined
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { convId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getConversationMessages(convId, limit, cursor);
    apiPaginated(res, result.messages, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getBans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getBans(true, limit, cursor);
    apiPaginated(res, result.bans, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getBanHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getBans(undefined, limit, cursor);
    apiPaginated(res, result.bans, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await adminService.getAnalytics();
    apiSuccess(res, analytics);
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.getAnalyticsUsers();
    apiSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await adminService.getAnalyticsMessages();
    apiSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.query.adminId as string | undefined;
    const action = req.query.action as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getAdminLogs(adminId, action, limit, cursor);
    apiPaginated(res, result.logs, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const getWarnings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor as string | undefined;
    const result = await adminService.getWarnings(limit, cursor);
    apiPaginated(res, result.warnings, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit,
    });
  } catch (error) {
    next(error);
  }
};
