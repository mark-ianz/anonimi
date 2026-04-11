"use client";

import { useRef, useCallback } from "react";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildAcceptValue, validateUploadFile } from "@/lib/uploadPolicy";

interface FileUploadProps {
  onFile: (file: File) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function FileUpload({
  onFile,
  accept,
  className,
  children,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateUploadFile(file, { category: "message", source: "file" });
      if (!validation.ok) {
        return;
      }

      onFile(file);
      e.target.value = "";
    },
    [onFile]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? buildAcceptValue()}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center transition-colors disabled:opacity-50",
          className
        )}
      >
        {children ?? <Paperclip className="w-5 h-5" />}
      </button>
    </>
  );
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  progress?: number;
}

export function FilePreview({ file, onRemove, progress }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const previewUrl = isImage ? URL.createObjectURL(file) : null;
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  return (
    <div className="relative flex items-center gap-2 p-2 rounded-lg bg-muted/60 border border-border/50 max-w-xs">
      {isImage && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={file.name} className="w-10 h-10 rounded object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{sizeMB} MB</p>
        {progress !== undefined && progress < 100 && (
          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
