import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/enums";
import { ForbiddenError } from "../utils/apiError";

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError("Not authenticated"));
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      next(new ForbiddenError("Insufficient permissions"));
      return;
    }

    next();
  };
};
