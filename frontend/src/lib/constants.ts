export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://anonimi-backend.vercel.app/api";

// Alias for convenience
export const API_BASE = API_BASE_URL;

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://anonimi-backend.vercel.app";

export const ACCESS_TOKEN_KEY = "anonimi_access_token";
export const REFRESH_TOKEN_KEY = "anonimi_refresh_token";
export const PENDING_VERIFICATION_KEY = "anonimi_pending_verification";
export const TEMP_SESSION_KEY = "anonimi_temp_session";

export const MESSAGES_PER_PAGE = 30;
export const CONVERSATIONS_PER_PAGE = 20;
export const CONTACTS_PER_PAGE = 50;
export const SEARCH_RESULTS_PER_PAGE = 10;

export const MB = 1024 * 1024;

export const MAX_IMAGE_SIZE = 3 * MB;
export const MAX_VIDEO_SIZE = 5 * MB;
export const MAX_FILE_SIZE = 3 * MB;
export const CAMERA_SIZE_BONUS = 3 * MB;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
];

export const ALLOWED_VIDEO_TYPES = ["video/mp4"];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/octet-stream",
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

export const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".rar",
  ".mp4",
];

export const TYPING_DEBOUNCE_MS = 500;
export const TYPING_TIMEOUT_MS = 5000;
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;

export const UNSEND_WINDOW_HOURS = 24;
