import api from "@/lib/api";
import {
  getUserKeyPair,
  hasUsableUserKeyPair,
  saveUserKeyPair,
  type UserKeyPair,
} from "@/lib/e2eeKeyStore";

export const ensureLocalE2EEKeyPair = async (): Promise<UserKeyPair | null> => {
  const localKeys = await getUserKeyPair();
  if (hasUsableUserKeyPair(localKeys)) {
    return localKeys;
  }

  const myKeyRes = await api.get("/e2ee/keys/me").catch(() => null);
  const recovered = myKeyRes?.data?.data as
    | {
        publicKey?: string;
        encryptedPrivateKey?: string;
        iv?: string;
        tag?: string;
      }
    | undefined;

  if (!recovered?.publicKey || !recovered?.encryptedPrivateKey) {
    return null;
  }

  await saveUserKeyPair({
    publicKey: recovered.publicKey,
    encryptedPrivateKey: recovered.encryptedPrivateKey,
    iv: recovered.iv ?? "",
    tag: recovered.tag ?? "",
  });

  return getUserKeyPair();
};
