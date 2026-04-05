"use client";

import { useEffect, useRef, useState } from "react";
import { decryptMessage, importKeyFromBase64 } from "@/lib/e2eeCrypto";
import { getConversationKey } from "@/lib/e2eeKeyStore";
import { useChatStore } from "@/stores/chatStore";
import type { Conversation } from "@/types/conversation";

export function useDecryptedPreviews(conversations: Conversation[]) {
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const { messages: storeMessages } = useChatStore();
  const decryptingRef = useRef(new Set<string>());

  useEffect(() => {
    const toDecrypt = conversations.filter((conv) => {
      const lm = conv.lastMessage;
      const alreadyDecrypted = decryptedMap[conv.id];
      const isDecrypting = decryptingRef.current.has(conv.id);

      if (!lm || alreadyDecrypted || isDecrypting) return false;

      // If server already gave us content, use it
      if (lm.content && !lm.isE2ee) return false;

      // Check if we have cipher data either from lastMessage or from store messages
      const hasCipher = !!(lm.e2eeCipher && lm.e2eeIv && lm.e2eeTag);
      const storeMsgs = storeMessages[conv.id] ?? [];
      const lastStoreMsg = storeMsgs[storeMsgs.length - 1];
      const hasStoreCipher = !!(lastStoreMsg?.isE2ee && lastStoreMsg?.e2eeCipher);

      return (lm.isE2ee && !lm.content) && (hasCipher || hasStoreCipher);
    });

    for (const conv of toDecrypt) {
      decryptingRef.current.add(conv.id);

      (async () => {
        try {
          const lm = conv.lastMessage;
          const storeMsgs = storeMessages[conv.id] ?? [];
          const lastStoreMsg = storeMsgs[storeMsgs.length - 1];

          // Prefer store message cipher fields (more reliable), fall back to lastMessage
          const cipher = lastStoreMsg?.e2eeCipher ?? lm?.e2eeCipher;
          const iv = lastStoreMsg?.e2eeIv ?? lm?.e2eeIv;
          const tag = lastStoreMsg?.e2eeTag ?? lm?.e2eeTag;

          if (!cipher || !iv || !tag) {
            decryptingRef.current.delete(conv.id);
            return;
          }

          const keyData = await getConversationKey(conv.id);
          if (!keyData) {
            decryptingRef.current.delete(conv.id);
            return;
          }

          const aesKey = await importKeyFromBase64(keyData.key);
          const content = await decryptMessage(cipher, iv, tag, aesKey);

          setDecryptedMap((prev) => ({ ...prev, [conv.id]: content }));

          const { updateConversationLastMessage } = useChatStore.getState();
          updateConversationLastMessage(conv.id, {
            content,
            senderId: lm?.senderId ?? "",
            type: lm?.type ?? "text",
            timestamp: lm?.timestamp ?? new Date().toISOString(),
            isE2ee: true,
          });
        } catch {
          // silent
        } finally {
          decryptingRef.current.delete(conv.id);
        }
      })();
    }
  }, [conversations, storeMessages, decryptedMap]);

  return decryptedMap;
}
