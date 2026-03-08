import mongoSanitize from "mongo-sanitize";

export const sanitize = (obj: unknown): unknown => {
  return mongoSanitize(obj);
};

export const sanitizeString = (str: string): string => {
  return mongoSanitize(str) as string;
};
