import { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";

export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No file uploaded" },
      });
    }

    const category = req.body.category || "message";
    const url = `/uploads/${category}s/${req.file.filename}`;

    apiSuccess(
      res,
      {
        url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};
