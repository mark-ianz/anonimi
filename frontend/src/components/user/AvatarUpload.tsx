"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AvatarUploadProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-12 h-12 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-2xl",
};

export default function AvatarUpload({ size = "md", className }: AvatarUploadProps) {
  const { user, updateAvatar, isUpdatingAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) updateAvatar(file);
    e.target.value = "";
  }

  const initials = user
    ? (user.username[0] ?? "U").toUpperCase()
    : "U";

  return (
    <label className={cn("relative cursor-pointer group inline-block", className)}>
      <div
        className={cn(
          "rounded-2xl overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-display font-semibold",
          sizeMap[size]
        )}
      >
        {user?.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        {isUpdatingAvatar ? (
          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </label>
  );
}
