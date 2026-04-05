"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  getUserKeyPair,
  getConversationKeys,
  saveConversationKey,
} from "@/lib/e2eeKeyStore";
import {
  deriveSharedSecretFromBase64,
  exportKeyAsBase64,
  generateAesKey,
  encryptKeyWithSharedSecret,
  decryptKeyWithSharedSecret,
} from "@/lib/e2eeCrypto";
import api from "@/lib/api";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";

interface GroupMemberKey {
  userId: string;
  publicKey: string;
}

export function useGroupKeyExchange(
  conversationId: string | null,
  groupId: string | null
) {
  const { user } = useAuthStore();
  const isExchanging = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;

  const exchangeKeys = useCallback(async () => {
    if (isExchanging.current || !conversationId || !groupId) return;
    isExchanging.current = true;

    try {
      const existingKeys = await getConversationKeys(conversationId);
      if (existingKeys.length > 0) {
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

      const members: Array<{ userId: string; joinedAt: string }> = membersRes.data.data;
      const sortedMembers = [...members].sort(
        (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );
      const creatorId = sortedMembers[0]?.userId;

      const memberKeys: GroupMemberKey[] = [];
      for (const member of sortedMembers) {
        try {
          const res = await api.get(`/e2ee/keys/${member.userId}`).catch(() => null);
          if (res?.data?.data) {
            memberKeys.push({ userId: member.userId, publicKey: res.data.data.publicKey });
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

      if (user?.id === creatorId) {
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

        console.log("[E2EE] Group creator distributed key v1 to", Object.keys(encryptedKeys).length, "members");
      } else {
        const socket = getChatSocket();
        socket.emit("e2ee:group:key:request", {
          groupId,
          conversationId,
          requesterId: userKeys.id,
        });

        console.log("[E2EE] Requested group key from existing members");
      }

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
      const existingKeys = await getConversationKeys(conversationId);
      if (existingKeys.length > 0) {
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

      console.log("[E2EE] Received group key v1 from", senderUserId);
    } catch (error) {
      console.error("Failed to receive group key:", error);
    } finally {
      isReceiving.current = false;
    }
  }, []);

  return { receiveKey };
}
