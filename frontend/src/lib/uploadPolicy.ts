import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  CAMERA_SIZE_BONUS,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/constants";

export type UploadSource = "file" | "camera";
export type UploadKind = "image" | "video" | "document";
export type UploadCategory = "avatar" | "message" | "group";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4"]);
const DOCUMENT_EXTENSIONS = new Set([".pdf", ".txt", ".doc", ".docx", ".rar"]);

const imageMimeSet = new Set(ALLOWED_IMAGE_TYPES);
const videoMimeSet = new Set(ALLOWED_VIDEO_TYPES);
const documentMimeSet = new Set(ALLOWED_DOCUMENT_TYPES);

const getExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
};

export const getUploadKind = (file: File): UploadKind | null => {
  const extension = getExtension(file.name);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (DOCUMENT_EXTENSIONS.has(extension)) return "document";
  return null;
};

export const getUploadMaxBytes = (kind: UploadKind, source: UploadSource = "file"): number => {
  const base = kind === "image" ? MAX_IMAGE_SIZE : kind === "video" ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (source === "camera" && (kind === "image" || kind === "video")) {
    return base + CAMERA_SIZE_BONUS;
  }
  return base;
};

const isMimeAllowed = (kind: UploadKind, mimeType: string): boolean => {
  if (!mimeType) return true;
  if (kind === "image") return imageMimeSet.has(mimeType);
  if (kind === "video") return videoMimeSet.has(mimeType);
  return documentMimeSet.has(mimeType);
};

export const formatMb = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return Number.isInteger(mb) ? `${mb}` : mb.toFixed(1);
};

export const buildAcceptValue = (): string => ALLOWED_EXTENSIONS.join(",");

export interface UploadValidationResult {
  ok: boolean;
  kind?: UploadKind;
  error?: string;
  maxBytes?: number;
}

export const validateUploadFile = (
  file: File,
  options?: { category?: UploadCategory; source?: UploadSource }
): UploadValidationResult => {
  const category = options?.category ?? "message";
  const source = options?.source ?? "file";

  const kind = getUploadKind(file);
  if (!kind) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  if ((category === "avatar" || category === "group") && kind !== "image") {
    return {
      ok: false,
      error: "Only images are allowed for profile and group photos.",
    };
  }

  if (!isMimeAllowed(kind, file.type)) {
    return {
      ok: false,
      error: "File type does not match the selected file extension.",
    };
  }

  const maxBytes = getUploadMaxBytes(kind, source);
  if (file.size > maxBytes) {
    return {
      ok: false,
      kind,
      maxBytes,
      error: `File too large. Max ${formatMb(maxBytes)} MB for this upload.`,
    };
  }

  return { ok: true, kind, maxBytes };
};
