import { PENDING_VERIFICATION_KEY } from "./constants";

export type VerificationType = "email" | "phone";

export interface PendingVerificationState {
  target: string;
  type: VerificationType;
  savedAt: number;
}

const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000;

const normalizeTarget = (target: string, type: VerificationType): string => {
  const trimmed = target.trim();
  return type === "email" ? trimmed.toLowerCase() : trimmed;
};

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
