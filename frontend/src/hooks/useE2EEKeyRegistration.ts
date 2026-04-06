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
  hasUsableUserKeyPair,
  markSessionInitialized,
  getSessionState,
  needsMigration,
  clearAllKeys,
  markMigrationComplete,
} from "@/lib/e2eeKeyStore";
import { ensureLocalE2EEKeyPair } from "@/lib/e2eeRecovery";
import api from "@/lib/api";

export function useE2EEKeyRegistration() {
  const { user, isAuthenticated } = useAuthStore();
  const isRegistering = useRef(false);
  const hasRegistered = useRef(false);

  useEffect(() => {
    hasRegistered.current = false;
    isRegistering.current = false;
  }, [user?.id, isAuthenticated]);

  const registerKeys = useCallback(async () => {
    if (isRegistering.current || hasRegistered.current || !user) return;
    isRegistering.current = true;

    try {
      const shouldMigrate = await needsMigration();
      if (shouldMigrate) {
        console.log("[E2EE-reg] Running migration v1 - clearing stale IndexedDB");
        await clearAllKeys();
        await markMigrationComplete();
      }

      console.log("[E2EE-reg] Checking keys for user", user.id);

      const serverRes = await api.get(`/e2ee/keys/${user.id}`).catch(() => null);

      if (serverRes?.data?.data) {
        console.log("[E2EE-reg] Keys already exist on server");
        const localKeys = await getUserKeyPair();
        if (!hasUsableUserKeyPair(localKeys)) {
          console.log("[E2EE-reg] Restoring local key pair from authenticated server record");
          const recovered = await ensureLocalE2EEKeyPair();
          if (!hasUsableUserKeyPair(recovered)) {
            throw new Error("Missing encrypted private key for E2EE recovery");
          }
        }
        await markSessionInitialized(user.id);
        hasRegistered.current = true;
        isRegistering.current = false;
        return;
      }

      const existingLocalKeys = await getUserKeyPair();
      let publicKey = existingLocalKeys?.publicKey ?? "";
      let privateKey = existingLocalKeys?.encryptedPrivateKey ?? "";

      if (!hasUsableUserKeyPair(existingLocalKeys)) {
        console.log("[E2EE-reg] Generating new key pair");
        const keyPair = await generateKeyPair();
        publicKey = await exportPublicKey(keyPair.publicKey);
        privateKey = await exportPrivateKey(keyPair.privateKey);

        console.log("[E2EE-reg] Saving to IndexedDB");
        await saveUserKeyPair({
          publicKey,
          encryptedPrivateKey: privateKey,
          iv: "",
          tag: "",
        });
      } else {
        console.log("[E2EE-reg] Re-registering existing local key pair to server");
      }

      console.log("[E2EE-reg] Registering with server");
      await api.post("/e2ee/keys/register", {
        publicKey,
        encryptedPrivateKey: privateKey,
        iv: "",
        tag: "",
      });

      console.log("[E2EE-reg] Registration complete");
      await markSessionInitialized(user.id);
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
      const localKeys = await getUserKeyPair();
      if (session?.initialized && session.userId === user.id && hasUsableUserKeyPair(localKeys)) {
        hasRegistered.current = true;
        return;
      }
      await registerKeys();
    };

    checkAndRegister();
  }, [isAuthenticated, user, registerKeys]);

  return { registerKeys };
}
