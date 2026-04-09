import { AsYouType, parsePhoneNumberFromString, validatePhoneNumberLength } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import countryCodeData from "@/data/country_code.json";

type CountryCodeItem = {
  name: string;
  code: string;
  emoji?: string;
  image?: string;
  dialCodes?: string[];
};

export type PhoneCountryOption = {
  name: string;
  code: CountryCode;
  emoji: string;
  image?: string;
  dialCode: string;
};

const rawCountryList = countryCodeData as CountryCodeItem[];

export const PHONE_COUNTRIES: PhoneCountryOption[] = rawCountryList
  .map((item) => ({
    name: item.name,
    code: item.code as CountryCode,
    emoji: item.emoji ?? "",
    image: item.image,
    dialCode: item.dialCodes?.[0] ?? "",
  }))
  .filter((item) => Boolean(item.code) && Boolean(item.dialCode));

const PHONE_LENGTH_ERRORS: Record<string, string> = {
  NOT_A_NUMBER: "Phone number must contain digits only.",
  INVALID_COUNTRY: "Country code is invalid.",
  TOO_SHORT: "Phone number is too short.",
  TOO_LONG: "Phone number is too long.",
};

export const sanitizePhoneInput = (value: string): string => {
  const stripped = value.replace(/[^\d+]/g, "");
  if (!stripped.includes("+")) return stripped;
  const digits = stripped.replace(/\+/g, "");
  return `+${digits}`;
};

export const formatPhoneInput = (value: string, country: CountryCode): string => {
  const sanitized = sanitizePhoneInput(value);
  if (!sanitized) return "";
  const formatter = sanitized.startsWith("+") ? new AsYouType() : new AsYouType(country);
  return formatter.input(sanitized);
};

export const parsePhoneForCountry = (value: string, country: CountryCode) => {
  const sanitized = sanitizePhoneInput(value);
  if (!sanitized) {
    return {
      e164: null as string | null,
      isValid: true,
      error: null as string | null,
    };
  }

  const parsed = sanitized.startsWith("+")
    ? parsePhoneNumberFromString(sanitized)
    : parsePhoneNumberFromString(sanitized, country);

  if (parsed?.isValid()) {
    return {
      e164: parsed.number,
      isValid: true,
      error: null,
    };
  }

  const lengthError = sanitized.startsWith("+")
    ? validatePhoneNumberLength(sanitized)
    : validatePhoneNumberLength(sanitized, country);

  return {
    e164: null,
    isValid: false,
    error:
      (lengthError && PHONE_LENGTH_ERRORS[lengthError]) ||
      "Phone number is invalid for the selected country.",
  };
};

export const detectCountryFromE164 = (value: string | null | undefined, fallback: CountryCode): CountryCode => {
  if (!value) return fallback;
  const parsed = parsePhoneNumberFromString(value);
  return (parsed?.country as CountryCode | undefined) ?? fallback;
};
