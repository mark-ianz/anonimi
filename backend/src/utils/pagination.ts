import { Types } from "mongoose";

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

export const getPaginationPipeline = (
  cursor?: string,
  limit: number = 20
): { $match: Record<string, unknown> }[] => {
  const pipeline: { $match: Record<string, unknown> }[] = [];

  if (cursor) {
    const cursorId = new Types.ObjectId(cursor);
    pipeline.push({
      $match: {
        _id: { $lt: cursorId },
      },
    });
  }

  return pipeline;
};

export const calculatePagination = (
  data: unknown[],
  limit: number
): { nextCursor?: string; hasMore: boolean } => {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && items.length > 0 
    ? (items[items.length - 1] as { _id: { toString: () => string } })?._id?.toString()
    : undefined;

  return {
    nextCursor,
    hasMore,
  };
};
