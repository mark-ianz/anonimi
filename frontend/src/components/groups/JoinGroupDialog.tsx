"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinGroupDialogProps {
  open: boolean;
  onClose: () => void;
}

function extractToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/groups\/join\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}

export default function JoinGroupDialog({ open, onClose }: JoinGroupDialogProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = extractToken(input);
    if (!token) {
      setError("Enter a valid invite link or token.");
      return;
    }

    onClose();
    setInput("");
    router.push(`/groups/join/${token}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md shadow-elevated animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h3 className="font-display font-semibold">Join Group</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Invite link or token</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                placeholder="https://.../groups/join/token or just the token"
                className={cn(
                  "w-full h-10 pl-10 pr-3 rounded-xl bg-muted/50 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                  error ? "border-destructive/50" : "border-transparent"
                )}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Paste the full invite link or just the token string.
            </p>
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Group
          </button>
        </form>
      </div>
    </div>
  );
}
