import { decryptMessage, importKeyFromBase64 } from "@/lib/e2eeCrypto";
import {
  getConversationKey,
  getConversationKeyByVersion,
  getConversationKeys,
  type ConversationKey,
} from "@/lib/e2eeKeyStore";

const dedupeKeys = (keys: Array<ConversationKey | null | undefined>): ConversationKey[] => {
  const seen = new Set<number>();
  const unique: ConversationKey[] = [];

  for (const key of keys) {
    if (!key || seen.has(key.keyVersion)) continue;
    seen.add(key.keyVersion);
    unique.push(key);
  }

  return unique;
};

export const getMessageKeyCandidates = async (
  conversationId: string,
  contentKeyVersion?: number | null
): Promise<ConversationKey[]> => {
  const [exactKey, latestKey, allKeys] = await Promise.all([
    getConversationKeyByVersion(conversationId, contentKeyVersion),
    getConversationKey(conversationId),
    getConversationKeys(conversationId),
  ]);

  return dedupeKeys([
    exactKey,
    latestKey,
    ...allKeys.filter((key) => key.keyVersion !== contentKeyVersion),
  ]);
};

export const decryptConversationPayload = async ({
  conversationId,
  cipherText,
  iv,
  tag,
  contentKeyVersion,
}: {
  conversationId: string;
  cipherText: string;
  iv: string;
  tag: string;
  contentKeyVersion?: number | null;
}): Promise<string | null> => {
  const keys = await getMessageKeyCandidates(conversationId, contentKeyVersion);

  for (const key of keys) {
    try {
      const aesKey = await importKeyFromBase64(key.key);
      return await decryptMessage(cipherText, iv, tag, aesKey);
    } catch {
      // Try the next stored key to support older messages and recovery paths.
    }
  }

  return null;
};
