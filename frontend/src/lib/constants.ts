export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Alias for convenience
export const API_BASE = API_BASE_URL;

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export const ACCESS_TOKEN_KEY = "echo_access_token";
export const REFRESH_TOKEN_KEY = "echo_refresh_token";
export const PENDING_VERIFICATION_KEY = "echo_pending_verification";

export const MESSAGES_PER_PAGE = 30;
export const CONVERSATIONS_PER_PAGE = 20;
export const CONTACTS_PER_PAGE = 50;
export const SEARCH_RESULTS_PER_PAGE = 10;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/zip",
  "text/plain",
  "video/mp4",
  "audio/mpeg",
  "audio/ogg",
];

export const TYPING_DEBOUNCE_MS = 500;
export const TYPING_TIMEOUT_MS = 5000;
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;

export const UNSEND_WINDOW_HOURS = 24;
