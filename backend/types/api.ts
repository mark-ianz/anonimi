export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
  pagination?: {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}
