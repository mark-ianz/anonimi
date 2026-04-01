"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface UserAvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  className?: string;
  textClassName?: string;
  roundedClassName?: string;
  alt?: string;
}

const DEFAULT_AVATAR_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%230f766e'/%3E%3Cstop offset='100%25' stop-color='%230ea5e9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' fill='url(%23g)'/%3E%3Ccircle cx='32' cy='24' r='11' fill='rgba(255,255,255,0.25)'/%3E%3Cpath d='M14 56c2-10 10-16 18-16s16 6 18 16' fill='none' stroke='rgba(255,255,255,0.25)' stroke-width='8' stroke-linecap='round'/%3E%3C/svg%3E";

function getInitial(name?: string | null): string {
  const normalized = (name ?? "").trim();
  if (!normalized) return "A";
  return normalized[0].toUpperCase();
}

export default function UserAvatar({
  imageUrl,
  name,
  className,
  textClassName,
  roundedClassName = "rounded-full",
  alt,
}: UserAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [svgError, setSvgError] = useState(false);
  const gradientId = useId().replace(/:/g, "");

  const initial = useMemo(() => getInitial(name), [name]);
  const resolvedImageUrl = resolveMediaUrl(imageUrl);
  const showImage = Boolean(imageUrl) && resolvedImageUrl !== failedImageUrl;

  return (
    <div
      className={cn(
        "relative overflow-hidden isolate bg-slate-500",
        roundedClassName,
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedImageUrl}
          alt={alt ?? name ?? "User"}
          className="w-full h-full object-cover"
          onError={() => setFailedImageUrl(resolvedImageUrl)}
        />
      ) : (
        !svgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={DEFAULT_AVATAR_SVG}
            alt={alt ?? name ?? "User"}
            className="w-full h-full object-cover"
            onError={() => setSvgError(true)}
          />
        ) : (
          <>
          <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0f766e" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="24" r="11" fill="rgba(255,255,255,0.25)" />
            <path
              d="M14 56c2-10 10-16 18-16s16 6 18 16"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-white font-semibold",
              textClassName
            )}
          >
            {initial}
          </span>
          </>
        )
      )}
    </div>
  );
}
