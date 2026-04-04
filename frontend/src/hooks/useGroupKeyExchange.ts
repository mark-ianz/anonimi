"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  getUserKeyPair,
  getConversationKey,
  saveConversationKey,
} from "@/lib/e2eeKeyStore";
import {
  deriveSharedSecretFromBase64,
  exportKeyAsBase64,
  generateAesKey,
  encryptKeyWithSharedSecret,
  decryptKeyWithSharedSecret,
  importKeyFromBase64,
} from "@/lib/e2eeCrypto";
import api from "@/lib/api";
import { getChatSocket } from "@/lib/socket";

interface GroupMemberKey {
  userId: string;
  publicKey: string;
}

export function useGroupKeyExchange(
  conversationId: string | null,
  groupId: string | null
) {
  const isExchanging = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;

  const exchangeKeys = useCallback(async () => {
    if (isExchanging.current || !conversationId || !groupId) return;
    isExchanging.current = true;

    try {
      const existingConvKey = await getConversationKey(conversationId);
      if (existingConvKey) {
        isExchanging.current = false;
        retryCount.current = 0;
        return;
      }

      const userKeys = await getUserKeyPair();
      if (!userKeys) {
        isExchanging.current = false;
        return;
      }

      const membersRes = await api.get(`/groups/${groupId}/members`).catch(() => null);
      if (!membersRes?.data?.data) {
        isExchanging.current = false;
        return;
      }

      const members: Array<{ userId: string }> = membersRes.data.data;
      const memberUserIds = members.map((m) => m.userId);

      const memberKeys: GroupMemberKey[] = [];
      for (const uid of memberUserIds) {
        try {
          const res = await api.get(`/e2ee/keys/${uid}`).catch(() => null);
          if (res?.data?.data) {
            memberKeys.push({ userId: uid, publicKey: res.data.data.publicKey });
          }
        } catch {
          // Skip members without keys
        }
      }

      if (memberKeys.length === 0) {
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          isExchanging.current = false;
          setTimeout(() => exchangeKeys(), 2000 * retryCount.current);
          return;
        }
        isExchanging.current = false;
        return;
      }

      const groupAesKey = await generateAesKey();
      const groupAesKeyBase64 = await exportKeyAsBase64(groupAesKey);

      const encryptedKeys: Record<string, string> = {};
      for (const member of memberKeys) {
        if (member.userId === userKeys.id) continue;
        try {
          const encrypted = await encryptKeyWithSharedSecret(
            groupAesKeyBase64,
            userKeys.encryptedPrivateKey,
            member.publicKey
          );
          encryptedKeys[member.userId] = encrypted;
        } catch (err) {
          console.error(`Failed to encrypt key for member ${member.userId}:`, err);
        }
      }

      if (Object.keys(encryptedKeys).length > 0) {
        const socket = getChatSocket();
        socket.emit("e2ee:group:key:distribute", {
          groupId,
          conversationId,
          keyVersion: 1,
          encryptedKeys,
        });
      }

      await saveConversationKey({
        conversationId,
        key: groupAesKeyBase64,
        keyVersion: 1,
      });

      retryCount.current = 0;
    } catch (error) {
      console.error("Group E2EE key exchange failed:", error);
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        isExchanging.current = false;
        setTimeout(() => exchangeKeys(), 3000 * retryCount.current);
        return;
      }
    } finally {
      isExchanging.current = false;
    }
  }, [conversationId, groupId]);

  useEffect(() => {
    exchangeKeys();
  }, [exchangeKeys]);

  return { exchangeKeys };
}

export function useGroupKeyReception() {
  const isReceiving = useRef(false);

  const receiveKey = useCallback(async (
    conversationId: string,
    encryptedPayload: string,
    senderUserId: string
  ) => {
    if (isReceiving.current) return;
    isReceiving.current = true;

    try {
      const existingConvKey = await getConversationKey(conversationId);
      if (existingConvKey) {
        isReceiving.current = false;
        return;
      }

      const userKeys = await getUserKeyPair();
      if (!userKeys) {
        isReceiving.current = false;
        return;
      }

      const senderKeyRes = await api.get(`/e2ee/keys/${senderUserId}`).catch(() => null);
      if (!senderKeyRes?.data?.data) {
        isReceiving.current = false;
        return;
      }

      const senderPublicKey = senderKeyRes.data.data.publicKey;

      const decryptedKeyBase64 = await decryptKeyWithSharedSecret(
        encryptedPayload,
        userKeys.encryptedPrivateKey,
        senderPublicKey
      );

      await saveConversationKey({
        conversationId,
        key: decryptedKeyBase64,
        keyVersion: 1,
      });
    } catch (error) {
      console.error("Failed to receive group key:", error);
    } finally {
      isReceiving.current = false;
    }
  }, []);

  return { receiveKey };
}
