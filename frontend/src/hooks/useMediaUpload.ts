"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { UploadSource, validateUploadFile } from "@/lib/uploadPolicy";

export type UploadCategory = "avatar" | "message" | "group";

interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function useMediaUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (
      file: File,
      category: UploadCategory,
      options?: { source?: UploadSource }
    ): Promise<UploadResult | null> => {
      const source = options?.source ?? "file";
      const validation = validateUploadFile(file, { category, source });

      if (!validation.ok) {
        toast.error(validation.error ?? "File type not allowed.");
        return null;
      }

      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      form.append("source", source);

      abortRef.current = new AbortController();
      setIsUploading(true);
      setProgress(0);

      try {
        const res = await api.post("/media/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
          signal: abortRef.current.signal,
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        });
        return res.data.data as UploadResult;
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "CanceledError") {
          toast.error("Upload failed. Please try again.");
        }
        return null;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { upload, cancel, isUploading, progress };
}
