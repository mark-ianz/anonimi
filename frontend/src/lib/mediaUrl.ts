import { API_BASE } from "@/lib/constants";

const normalizeBackendBase = (value: string): string => {
  const withoutTrailingSlash = value.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
};

const backendBase = normalizeBackendBase(API_BASE);

const hasProtocol = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("blob:");

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (hasProtocol(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${backendBase}${normalizedPath}`;
}
