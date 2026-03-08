import { Request, Response, NextFunction } from "express";
import * as supportService from "../services/support.service";
import { apiSuccess } from "../utils/apiResponse";

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, reason, message } = req.body;
    const result = await supportService.createTicket(
      req.user!._id.toString(),
      subject,
      reason,
      message
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tickets = await supportService.getTickets(req.user!._id.toString());
    apiSuccess(res, tickets);
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const ticket = await supportService.getTicket(ticketId, req.user!._id.toString());
    apiSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

export const replyToTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const result = await supportService.replyToTicket(
      ticketId,
      req.user!._id.toString(),
      content
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};
