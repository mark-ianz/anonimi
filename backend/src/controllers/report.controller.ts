import { Request, Response, NextFunction } from "express";
import * as reportService from "../services/report.service";
import { apiSuccess } from "../utils/apiResponse";

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    const result = await reportService.createReport(
      req.user!._id.toString(),
      targetType,
      targetId,
      reason,
      description
    );
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};
