import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/apiError";

export const requireFullAccount = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.isTemporary) {
    next(
      new ForbiddenError(
        "Temporary accounts must be claimed to access this feature."
      )
    );
    return;
  }

  next();
};
