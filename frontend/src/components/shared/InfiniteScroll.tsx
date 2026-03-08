"use client";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
}

export default function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isLoading,
  className,
}: InfiniteScrollProps) {
  const sentinelRef = useInfiniteScroll(onLoadMore, { hasMore, isLoading });

  return (
    <div ref={sentinelRef} className={className}>
      {isLoading && hasMore && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
