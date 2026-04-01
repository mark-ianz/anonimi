import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export const generateAnonimiId = (): string => {
  return `aid_${nanoid(8)}`;
};

export const generateId = (): string => {
  return nanoid(24);
};
