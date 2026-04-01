import { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";

const resolveFolder = (category: unknown): "avatars" | "groups" | "messages" => {
  if (category === "avatar") return "avatars";
  if (category === "group") return "groups";
  return "messages";
};

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

    const folder = resolveFolder(req.body.category);
    const url = `/uploads/${folder}/${req.file.filename}`;

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
