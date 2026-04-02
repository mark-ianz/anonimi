import { PENDING_VERIFICATION_KEY } from "./constants";

export type VerificationType = "email" | "phone";

export interface PendingVerificationState {
  target: string;
  type: VerificationType;
  savedAt: number;
}

const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_KEY = "anonimi-verification-resend";
const RESEND_COOLDOWN_SECONDS = 60;

const normalizeTarget = (target: string, type: VerificationType): string => {
  const trimmed = target.trim();
  return type === "email" ? trimmed.toLowerCase() : trimmed;
};

interface ResendCooldownState {
  target: string;
  type: VerificationType;
  expiresAt: number;
}

export const savePendingVerification = (
  state: Omit<PendingVerificationState, "savedAt">
) => {
  if (typeof window === "undefined") return;

  const payload: PendingVerificationState = {
    ...state,
    target: normalizeTarget(state.target, state.type),
    savedAt: Date.now(),
  };

  localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(payload));
};

export const getPendingVerification = (): PendingVerificationState | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(PENDING_VERIFICATION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingVerificationState;
    if (!parsed?.target || !parsed?.type || !parsed?.savedAt) {
      localStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }

    if (Date.now() - parsed.savedAt > MAX_PENDING_AGE_MS) {
      localStorage.removeItem(PENDING_VERIFICATION_KEY);
      return null;
    }

    return {
      ...parsed,
      target: normalizeTarget(parsed.target, parsed.type),
    };
  } catch {
    localStorage.removeItem(PENDING_VERIFICATION_KEY);
    return null;
  }
};

export const clearPendingVerification = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_VERIFICATION_KEY);
};

export const startResendCooldown = (target: string, type: VerificationType) => {
  if (typeof window === "undefined") return;
  const payload: ResendCooldownState = {
    target: normalizeTarget(target, type),
    type,
    expiresAt: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
  };
  localStorage.setItem(RESEND_COOLDOWN_KEY, JSON.stringify(payload));
};

export const getResendCooldownSeconds = (
  target: string,
  type: VerificationType
): number => {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(RESEND_COOLDOWN_KEY);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as ResendCooldownState;
    const normalizedTarget = normalizeTarget(target, type);
    if (parsed?.target !== normalizedTarget || parsed?.type !== type) {
      return 0;
    }
    const remainingMs = parsed.expiresAt - Date.now();
    if (remainingMs <= 0) {
      localStorage.removeItem(RESEND_COOLDOWN_KEY);
      return 0;
    }
    return Math.ceil(remainingMs / 1000);
  } catch {
    localStorage.removeItem(RESEND_COOLDOWN_KEY);
    return 0;
  }
};

export const clearResendCooldown = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RESEND_COOLDOWN_KEY);
};
