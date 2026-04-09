import { parsePhoneNumberFromString, validatePhoneNumberLength } from "libphonenumber-js";
import { ValidationError } from "./apiError";

const PHONE_LENGTH_ERRORS: Record<string, string> = {
  NOT_A_NUMBER: "Phone number must contain digits only.",
  INVALID_COUNTRY: "Phone number country code is invalid.",
  TOO_SHORT: "Phone number is too short.",
  TOO_LONG: "Phone number is too long.",
};

export const normalizePhoneNumber = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ValidationError("Validation failed", [
      { path: "body.phone", message: "Phone number is required." },
    ]);
  }

  const parsed = parsePhoneNumberFromString(trimmed);
  if (parsed?.isValid()) {
    return parsed.number;
  }

  const lengthIssue = validatePhoneNumberLength(trimmed);
  throw new ValidationError("Validation failed", [
    {
      path: "body.phone",
      message:
        (lengthIssue && PHONE_LENGTH_ERRORS[lengthIssue]) ||
        "Phone number is invalid. Use international format like +639171234567.",
    },
  ]);
};

export const tryNormalizePhoneNumber = (value: string): string | null => {
  try {
    return normalizePhoneNumber(value);
  } catch {
    return null;
  }
};
