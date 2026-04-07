import { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { User } from "../models/user.model";
import { uploadFileToCloudinary } from "../services/cloudinary.service";

export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No file uploaded" },
      });
    }

    const requestedCategory = req.body?.category;
    if (req.user?.isTemporary && requestedCategory === "message") {
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

    const uploadCategory = requestedCategory === "avatar" || requestedCategory === "group"
      ? requestedCategory
      : "message";
    const upload = await uploadFileToCloudinary(req.file, uploadCategory);

    apiSuccess(
      res,
      {
        url: upload.url,
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
