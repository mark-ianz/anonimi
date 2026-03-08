import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export const generateEchoId = (): string => {
  return `eid_${nanoid(8)}`;
};

export const generateId = (): string => {
  return nanoid(24);
};
