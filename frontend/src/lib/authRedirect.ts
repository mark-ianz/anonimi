export const DEFAULT_AUTH_REDIRECT = "/chat";

export function sanitizeAuthRedirect(value: string | null | undefined): string {
  if (!value) return DEFAULT_AUTH_REDIRECT;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return DEFAULT_AUTH_REDIRECT;
  if (trimmed.startsWith("//")) return DEFAULT_AUTH_REDIRECT;

  return trimmed;
}

export function buildLoginRedirect(pathname: string, search?: string): string {
  const suffix = search && search !== "?" ? search : "";
  return `${pathname}${suffix}`;
}
