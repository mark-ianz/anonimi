import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  variant?: "line" | "avatar" | "card" | "message" | "conversation";
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
    />
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
      <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-8" />
        </div>
        <SkeletonBlock className="h-3 w-48" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ isMine = false }: { isMine?: boolean }) {
  return (
    <div className={cn("flex items-end gap-2 px-4 py-1", isMine && "flex-row-reverse")}>
      {!isMine && <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />}
      <SkeletonBlock className={cn("h-10 rounded-2xl", isMine ? "w-48" : "w-56")} />
    </div>
  );
}

export default function LoadingSkeleton({
  className,
  rows = 5,
  variant = "line",
}: LoadingSkeletonProps) {
  if (variant === "conversation") {
    return (
      <div className={cn("space-y-0", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "message") {
    return (
      <div className={cn("space-y-2 py-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <MessageSkeleton key={i} isMine={i % 3 === 0} />
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    return <SkeletonBlock className={cn("w-12 h-12 rounded-full", className)} />;
  }

  if (variant === "card") {
    return (
      <div className={cn("p-4 rounded-xl border border-border/50 space-y-3", className)}>
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn("h-4", i === 0 ? "w-3/4" : i % 2 === 0 ? "w-full" : "w-5/6")}
        />
      ))}
    </div>
  );
}
