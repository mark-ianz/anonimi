"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  getConversationKey,
  saveConversationKey,
} from "@/lib/e2eeKeyStore";
import {
  deriveSharedSecretFromBase64,
  exportKeyAsBase64,
} from "@/lib/e2eeCrypto";
import { ensureLocalE2EEKeyPair } from "@/lib/e2eeRecovery";
import api from "@/lib/api";

export function useE2EEKeyExchange(conversationId: string | null, participantUserId: string | null) {
  const isExchanging = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exchangeKeys = useCallback(async () => {
    if (isExchanging.current || !conversationId || !participantUserId) return;
    isExchanging.current = true;

    try {
      const existingConvKey = await getConversationKey(conversationId);
      if (existingConvKey) {
        console.log("[E2EE] Key already exists for", conversationId);
        isExchanging.current = false;
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const userKeys = await ensureLocalE2EEKeyPair();
      if (!userKeys?.encryptedPrivateKey) {
        console.warn("[E2EE] No local key pair yet for", participantUserId);
        isExchanging.current = false;
        return;
      }

      const peerKeyRes = await api.get(`/e2ee/keys/${participantUserId}`).catch(() => null);
      if (!peerKeyRes?.data?.data) {
        console.warn("[E2EE] Peer", participantUserId, "has no keys on server yet");
        isExchanging.current = false;
        return;
      }

      const peerPublicKey = peerKeyRes.data.data.publicKey;
      console.log("[E2EE] Deriving shared secret with peer", participantUserId);

      const sharedSecret = await deriveSharedSecretFromBase64(
        userKeys.encryptedPrivateKey,
        peerPublicKey
      );

      const keyBase64 = await exportKeyAsBase64(sharedSecret);
      console.log("[E2EE] Saving conversation key for", conversationId, "key:", keyBase64.slice(0, 20) + "...");

      await saveConversationKey({
        conversationId,
        key: keyBase64,
        keyVersion: 1,
      });

      console.log("[E2EE] Key exchange complete for", conversationId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } catch (error) {
      console.error("[E2EE] Key exchange error:", error);
    } finally {
      isExchanging.current = false;
    }
  }, [conversationId, participantUserId]);

  useEffect(() => {
    if (!conversationId || !participantUserId) return;

    exchangeKeys();

    intervalRef.current = setInterval(() => {
      getConversationKey(conversationId).then((existing) => {
        if (!existing) {
          exchangeKeys();
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      });
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [conversationId, participantUserId, exchangeKeys]);

  return { exchangeKeys };
}
