import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/apiError";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as ZodError).issues ?? (error as any).errors ?? [];
        const details = issues.map((e: any) => ({
          path: Array.isArray(e.path) ? e.path.join(".") : "",
          message: e.message,
        }));
        next(new ValidationError("Validation failed", details));
        return;
      }
      next(error);
    }
  };
};
