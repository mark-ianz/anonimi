"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
} from "@/lib/e2eeCrypto";
import {
  saveUserKeyPair,
  getUserKeyPair,
  markSessionInitialized,
  getSessionState,
} from "@/lib/e2eeKeyStore";
import api from "@/lib/api";

export function useE2EEKeyRegistration() {
  const { user, isAuthenticated } = useAuthStore();
  const isRegistering = useRef(false);
  const hasRegistered = useRef(false);

  const registerKeys = useCallback(async () => {
    if (isRegistering.current || hasRegistered.current || !user) return;
    isRegistering.current = true;

    try {
      console.log("[E2EE-reg] Checking keys for user", user.id);

      const serverRes = await api.get(`/e2ee/keys/${user.id}`).catch(() => null);

      if (serverRes?.data?.data) {
        console.log("[E2EE-reg] Keys already exist on server");
        const localKeys = await getUserKeyPair();
        if (!localKeys) {
          console.log("[E2EE-reg] Server has keys but local doesn't, saving server public key locally");
          await saveUserKeyPair({
            publicKey: serverRes.data.data.publicKey,
            encryptedPrivateKey: "",
            iv: "",
            tag: "",
          });
        }
        await markSessionInitialized();
        hasRegistered.current = true;
        isRegistering.current = false;
        return;
      }

      console.log("[E2EE-reg] Generating new key pair");
      const keyPair = await generateKeyPair();
      const publicKey = await exportPublicKey(keyPair.publicKey);
      const privateKey = await exportPrivateKey(keyPair.privateKey);

      console.log("[E2EE-reg] Saving to IndexedDB");
      await saveUserKeyPair({
        publicKey,
        encryptedPrivateKey: privateKey,
        iv: "",
        tag: "",
      });

      console.log("[E2EE-reg] Registering with server");
      await api.post("/e2ee/keys/register", {
        publicKey,
        encryptedPrivateKey: privateKey,
        iv: "",
        tag: "",
      });

      console.log("[E2EE-reg] Registration complete");
      await markSessionInitialized();
      hasRegistered.current = true;
    } catch (error: any) {
      console.error("[E2EE-reg] Failed:", error?.response?.data ?? error.message);
    } finally {
      isRegistering.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkAndRegister = async () => {
      const session = await getSessionState();
      if (session?.initialized) {
        hasRegistered.current = true;
        return;
      }
      await registerKeys();
    };

    checkAndRegister();
  }, [isAuthenticated, user, registerKeys]);

  return { registerKeys };
}
