import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "File size exceeds allowed limit",
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: err.message,
      },
    });
    return;
  }

  logger.error(err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        env.NODE_ENV === "development"
          ? err.message || "An unexpected error occurred"
          : "An unexpected error occurred",
      ...(env.NODE_ENV === "development" && err.stack
        ? { details: [{ stack: err.stack }] }
        : {}),
    },
  });
};
