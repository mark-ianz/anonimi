import { Request, Response, NextFunction } from "express";
import path from "path";
import { apiSuccess } from "../utils/apiResponse";
import { env } from "../config/env";
import { User } from "../models/user.model";

const resolveFolder = (category: unknown): "avatars" | "groups" | "messages" => {
  if (category === "avatar") return "avatars";
  if (category === "group") return "groups";
  return "messages";
};

const resolveFolderFromSavedFile = (filePath: string): "avatars" | "groups" | "messages" | null => {
  const relativePath = path.relative(path.resolve(env.UPLOAD_DIR), filePath);
  if (!relativePath || relativePath.startsWith("..")) return null;

  const [folder] = relativePath.split(path.sep);
  if (folder === "avatars" || folder === "groups" || folder === "messages") {
    return folder;
  }

  return null;
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

    const category = req.body?.category;
    if (req.user?.isTemporary && category === "message") {
      const currentCount = req.user.tempMediaCount ?? 0;
      if (currentCount >= 1) {
        res.status(403).json({
          success: false,
          error: {
            code: "TEMP_MEDIA_LIMIT",
            message: "Temporary accounts can only upload one media file.",
          },
        });
        return;
      }

      await User.updateOne(
        { _id: req.user._id },
        { $inc: { tempMediaCount: 1 } }
      );
    }

    const folder = resolveFolderFromSavedFile(req.file.path) ?? resolveFolder(req.body.category);
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
