"use client";

import { useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect, useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  size?: "sm" | "md";
}

export default function SearchInput({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  className,
  autoFocus,
  size = "md",
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const debounced = useDebounce(value, debounceMs);

  useEffect(() => {
    onDebouncedChange?.(debounced);
  }, [debounced, onDebouncedChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (controlledValue === undefined) setInternalValue(val);
      onChange?.(val);
    },
    [controlledValue, onChange]
  );

  const clear = useCallback(() => {
    if (controlledValue === undefined) setInternalValue("");
    onChange?.("");
  }, [controlledValue, onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
        )}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-xl bg-muted/50 border-0 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
          size === "sm" ? "h-8 pl-8 pr-8 text-xs" : "h-10 pl-10 pr-10 text-sm"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/30 flex items-center justify-center hover:bg-muted-foreground/50 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
