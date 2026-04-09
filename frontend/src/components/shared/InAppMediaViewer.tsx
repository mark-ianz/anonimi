"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InAppMediaViewerProps {
  open: boolean;
  onClose: () => void;
  src: string;
  type: "image" | "video";
  alt?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function InAppMediaViewer({
  open,
  onClose,
  src,
  type,
  alt = "Media",
}: InAppMediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const canUsePortal = typeof document !== "undefined";

  const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (type !== "image") return;
      if (event.key === "+") setZoom((value) => clampZoom(value + 0.25));
      if (event.key === "-") setZoom((value) => clampZoom(value - 0.25));
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, type]);

  if (!open || !canUsePortal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-3 sm:p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        aria-label="Close media viewer overlay"
      />

      <div className="relative z-[221] flex max-h-full w-full max-w-6xl flex-col items-center gap-3">
        <div className="flex w-full items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white hover:bg-black/55"
            aria-label="Close media viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {type === "image" && (
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-2 py-1 text-white">
            <button
              type="button"
              onClick={() => setZoom((value) => clampZoom(value - 0.25))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-xs font-medium">{zoomPercent}</span>
            <button
              type="button"
              onClick={() => setZoom((value) => clampZoom(value + 0.25))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex w-full flex-1 items-center justify-center overflow-auto">
          {type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className={cn(
                "max-h-[84vh] max-w-full object-contain transition-transform duration-150 ease-out select-none",
                zoom > 1 && "cursor-zoom-out"
              )}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              onDoubleClick={() => setZoom((value) => (value > 1 ? 1 : 2))}
              onWheel={(event) => {
                event.preventDefault();
                const delta = event.deltaY > 0 ? -0.2 : 0.2;
                setZoom((value) => clampZoom(value + delta));
              }}
            />
          ) : (
            <video
              src={src}
              controls
              autoPlay
              className="max-h-[84vh] w-full rounded-xl bg-black object-contain"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
