"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { UploadSource, validateUploadFile } from "@/lib/uploadPolicy";
import UserAvatar from "@/components/shared/UserAvatar";

interface AvatarUploadProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  previewUrl?: string | null;
  pendingRemoval?: boolean;
  isSaving?: boolean;
  onSelectAvatar?: (file: File, source: UploadSource) => void;
  onRemoveAvatar?: () => void;
}

const sizeMap = {
  sm: "w-12 h-12 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-2xl",
};

export default function AvatarUpload({
  size = "md",
  className,
  previewUrl,
  pendingRemoval,
  isSaving,
  onSelectAvatar,
  onRemoveAvatar,
}: AvatarUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, source: UploadSource) {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateUploadFile(file, { category: "avatar", source });
      if (!validation.ok) {
        toast.error(validation.error ?? "Invalid file.");
      } else {
        onSelectAvatar?.(file, source);
      }
    }
    e.target.value = "";
  }

  const displayImage = pendingRemoval ? null : (previewUrl ?? user?.profileImage ?? null);

  useEffect(() => {
    if (!popoverOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [popoverOpen]);

  return (
    <div className={cn("relative inline-block", className)} ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          if (isSaving) return;
          setPopoverOpen((prev) => !prev);
        }}
        className="relative cursor-pointer group block"
        aria-haspopup="menu"
        aria-expanded={popoverOpen}
        aria-label="Profile photo options"
      >
      <UserAvatar
        imageUrl={displayImage ? resolveMediaUrl(displayImage) : null}
        name={user?.username ?? "User"}
        alt={user?.username ?? "User"}
        className={sizeMap[size]}
        roundedClassName="rounded-2xl"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        {isSaving ? (
          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <div className="flex items-center gap-1 text-white">
            <Camera className="w-5 h-5" />
            <ChevronDown className="w-4 h-4" />
          </div>
        )}
      </div>
      </button>

      {popoverOpen && (
        <div className="absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border/60 bg-card/95 p-1 shadow-elevated backdrop-blur-sm animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setPopoverOpen(false);
              inputRef.current?.click();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
          >
            <Upload className="h-4 w-4" />
            Select photo
          </button>
          <button
            type="button"
            onClick={() => {
              setPopoverOpen(false);
              onRemoveAvatar?.();
            }}
            disabled={!displayImage || isSaving}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remove photo
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif"
        className="hidden"
        onChange={(event) => handleChange(event, "file")}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif"
        capture="environment"
        className="hidden"
        onChange={(event) => handleChange(event, "camera")}
      />
    </div>
  );
}
