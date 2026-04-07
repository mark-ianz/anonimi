import multer from "multer";
import path from "path";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "../utils/apiError";

export type UploadCategory = "avatar" | "message" | "group";
type UploadSource = "file" | "camera";
type UploadKind = "image" | "video" | "document";

const MB = 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4"]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".pdf", ".txt", ".doc", ".docx", ".rar"]);

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4"]);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/octet-stream",
]);

const MAX_BYTES_BY_KIND: Record<UploadKind, number> = {
  image: 3 * MB,
  video: 5 * MB,
  document: 3 * MB,
};

const CAMERA_BONUS_BYTES = 3 * MB;
const MAX_MULTER_FILE_BYTES = MAX_BYTES_BY_KIND.video + CAMERA_BONUS_BYTES;
const FORCED_CATEGORY_KEY = "__forcedUploadCategory" as const;

const isUploadCategory = (value: unknown): value is UploadCategory =>
  value === "avatar" || value === "message" || value === "group";

const getForcedCategory = (req: Request): UploadCategory | null => {
  const forced = (req as Request & { [FORCED_CATEGORY_KEY]?: unknown })[FORCED_CATEGORY_KEY];
  return isUploadCategory(forced) ? forced : null;
};

const resolveCategory = (req: Request & { body?: Record<string, unknown> }): UploadCategory => {
  const forcedCategory = getForcedCategory(req);
  if (forcedCategory) return forcedCategory;

  const bodyCategory = req.body?.category;
  return isUploadCategory(bodyCategory) ? bodyCategory : "message";
};

const resolveSource = (req: Request & { body?: Record<string, unknown> }): UploadSource =>
  req.body?.source === "camera" ? "camera" : "file";

const getKindFromExtension = (fileName: string): UploadKind | null => {
  const extension = path.extname(fileName).toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.has(extension)) return "image";
  if (ALLOWED_VIDEO_EXTENSIONS.has(extension)) return "video";
  if (ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) return "document";
  return null;
};

const isMimeAllowedForKind = (kind: UploadKind, mimeType: string): boolean => {
  if (kind === "image") return ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
  if (kind === "video") return ALLOWED_VIDEO_MIME_TYPES.has(mimeType);
  return ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType);
};

const getMaxBytes = (kind: UploadKind, source: UploadSource): number =>
  MAX_BYTES_BY_KIND[kind] + (source === "camera" && (kind === "image" || kind === "video") ? CAMERA_BONUS_BYTES : 0);

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = new Set([
    ...ALLOWED_IMAGE_MIME_TYPES,
    ...ALLOWED_VIDEO_MIME_TYPES,
    ...ALLOWED_DOCUMENT_MIME_TYPES,
  ]);

  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new ApiError("File type is not allowed", 400, "INVALID_FILE_TYPE"));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_MULTER_FILE_BYTES,
  },
});

const validateUploadedFile = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const file = req.file;
  if (!file) {
    next();
    return;
  }

  const category = resolveCategory(req);
  const source = resolveSource(req);
  const kind = getKindFromExtension(file.originalname);

  if (!kind) {
    next(new ApiError("File extension is not allowed", 400, "INVALID_FILE_TYPE"));
    return;
  }

  if (category !== "message" && kind !== "image") {
    next(new ApiError("Only image files are allowed for this upload", 400, "INVALID_FILE_TYPE"));
    return;
  }

  if (!isMimeAllowedForKind(kind, file.mimetype)) {
    next(new ApiError("File content type does not match extension", 400, "INVALID_FILE_TYPE"));
    return;
  }

  const maxBytes = getMaxBytes(kind, source);
  if (file.size > maxBytes) {
    next(
      new ApiError(
        "File size exceeds allowed limit",
        400,
        "FILE_TOO_LARGE",
        [{ maxBytes, actualBytes: file.size, source, kind }]
      )
    );
    return;
  }

  next();
};

export const uploadSingle = (
  fieldName: string,
  forcedCategory?: UploadCategory
): RequestHandler => {
  const single = upload.single(fieldName);

  return (req, res, next) => {
    if (forcedCategory) {
      (req as Request & { [FORCED_CATEGORY_KEY]?: UploadCategory })[FORCED_CATEGORY_KEY] = forcedCategory;
      req.body = req.body ?? {};
      req.body.category = forcedCategory;
    }

    single(req, res, (err?: unknown) => {
      if (err) {
        next(err as Error);
        return;
      }
      validateUploadedFile(req, res, next);
    });
  };
};
