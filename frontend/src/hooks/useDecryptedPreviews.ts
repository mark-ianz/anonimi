"use client";

import { useEffect, useRef, useState } from "react";
import { decryptConversationPayload } from "@/lib/e2eeMessageCrypto";
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
      const hasCipher = !!(lm.contentCipher && lm.contentIv && lm.contentTag);
      const storeMsgs = storeMessages[conv.id] ?? [];
      const lastStoreMsg = storeMsgs[storeMsgs.length - 1];
      const hasStoreCipher = !!(lastStoreMsg?.isE2ee && lastStoreMsg?.contentCipher);

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
          const cipher = lastStoreMsg?.contentCipher ?? lm?.contentCipher;
          const iv = lastStoreMsg?.contentIv ?? lm?.contentIv;
          const tag = lastStoreMsg?.contentTag ?? lm?.contentTag;
          const contentKeyVersion =
            lastStoreMsg?.contentKeyVersion ?? lm?.contentKeyVersion ?? null;

          if (!cipher || !iv || !tag) {
            decryptingRef.current.delete(conv.id);
            return;
          }

          const content = await decryptConversationPayload({
            conversationId: conv.id,
            cipherText: cipher,
            iv,
            tag,
            contentKeyVersion,
          });
          if (content == null) return;

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
