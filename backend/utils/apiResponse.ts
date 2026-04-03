import { Response } from "express";
import { ApiResponse } from "../types/api";

export const apiSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
};

export const apiError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  details?: unknown[]
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};

export const apiPaginated = <T>(
  res: Response,
  data: T,
  pagination: { nextCursor?: string; hasMore: boolean; limit: number }
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    pagination,
  };
  return res.status(200).json(response);
};
