"use client";

import api from "@/lib/api";
import {
  decryptKeyWithSharedSecret,
  deriveSharedSecretFromBase64,
  encryptKeyWithSharedSecret,
  exportKeyAsBase64,
  generateAesKey,
} from "@/lib/e2eeCrypto";
import { ensureLocalE2EEKeyPair } from "@/lib/e2eeRecovery";
import {
  getConversationKey,
  getConversationKeyByVersion,
  saveConversationKey,
} from "@/lib/e2eeKeyStore";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import type { Conversation } from "@/types/conversation";

export const ensureConversationKeyForConversation = async (
  conversation: Conversation
): Promise<boolean> => {
  const existingKey =
    (conversation.lastMessage?.contentKeyVersion != null
      ? await getConversationKeyByVersion(
          conversation.id,
          conversation.lastMessage.contentKeyVersion
        )
      : null) ?? (await getConversationKey(conversation.id));

  if (existingKey) {
    return true;
  }

  const userKeys = await ensureLocalE2EEKeyPair();
  if (!userKeys?.encryptedPrivateKey) {
    return false;
  }

  if (conversation.type === "private" && conversation.participant?.id) {
    const peerKeyRes = await api.get(`/e2ee/keys/${conversation.participant.id}`).catch(() => null);
    if (!peerKeyRes?.data?.data?.publicKey) {
      return false;
    }

    const sharedSecretKey = await deriveSharedSecretFromBase64(
      userKeys.encryptedPrivateKey,
      peerKeyRes.data.data.publicKey
    );
    const sharedSecret = await exportKeyAsBase64(sharedSecretKey);

    await saveConversationKey({
      conversationId: conversation.id,
      key: sharedSecret,
      keyVersion: 1,
    });

    return true;
  }

  if (conversation.type === "group" && conversation.group?.id) {
    const keyRes = await api
      .get(`/e2ee/conversations/${conversation.id}/key`)
      .catch(() => null);

    const payload = keyRes?.data?.data as
      | {
          encryptedKey?: string;
          senderId?: string;
          keyVersion?: number;
        }
      | undefined;

    if (payload?.encryptedKey && payload.senderId && payload.keyVersion != null) {
      const senderKeyRes = await api.get(`/e2ee/keys/${payload.senderId}`).catch(() => null);
      if (!senderKeyRes?.data?.data?.publicKey) {
        return false;
      }

      const decryptedKey = await decryptKeyWithSharedSecret(
        payload.encryptedKey,
        userKeys.encryptedPrivateKey,
        senderKeyRes.data.data.publicKey
      );

      await saveConversationKey({
        conversationId: conversation.id,
        key: decryptedKey,
        keyVersion: payload.keyVersion,
      });

      return true;
    }

    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId) {
      return false;
    }

    const membersRes = await api.get(`/groups/${conversation.group.id}/members`).catch(() => null);
    const members = membersRes?.data?.data as
      | Array<{ userId: string; joinedAt: string }>
      | undefined;

    if (!members?.length) {
      return false;
    }

    const sortedMembers = [...members].sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    );

    if (sortedMembers[0]?.userId !== currentUserId) {
      return false;
    }

    const memberKeys: Array<{ userId: string; publicKey: string }> = [];
    for (const member of sortedMembers) {
      const memberKeyRes = await api.get(`/e2ee/keys/${member.userId}`).catch(() => null);
      if (memberKeyRes?.data?.data?.publicKey) {
        memberKeys.push({
          userId: member.userId,
          publicKey: memberKeyRes.data.data.publicKey,
        });
      }
    }

    if (memberKeys.length === 0) {
      return false;
    }

    const groupAesKey = await generateAesKey();
    const groupAesKeyBase64 = await exportKeyAsBase64(groupAesKey);
    const encryptedKeys: Record<string, string> = {};

    for (const member of memberKeys) {
      try {
        encryptedKeys[member.userId] = await encryptKeyWithSharedSecret(
          groupAesKeyBase64,
          userKeys.encryptedPrivateKey,
          member.publicKey
        );
      } catch {
        // Skip members whose key could not be encrypted.
      }
    }

    if (Object.keys(encryptedKeys).length === 0) {
      return false;
    }

    getChatSocket().emit("e2ee:group:key:distribute", {
      groupId: conversation.group.id,
      conversationId: conversation.id,
      keyVersion: 1,
      encryptedKeys,
    });

    await saveConversationKey({
      conversationId: conversation.id,
      key: groupAesKeyBase64,
      keyVersion: 1,
    });

    return true;
  }

  return false;
};
