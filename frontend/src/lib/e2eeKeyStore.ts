const DB_NAME = "e2ee-keys";
const DB_VERSION = 4;
const STORE_KEYS = "keys";
const STORE_CONVERSATIONS = "conversations";
const STORE_SESSION = "session";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        db.deleteObjectStore(STORE_CONVERSATIONS);
      }
      if (db.objectStoreNames.contains(STORE_KEYS)) {
        db.deleteObjectStore(STORE_KEYS);
      }
      if (db.objectStoreNames.contains(STORE_SESSION)) {
        db.deleteObjectStore(STORE_SESSION);
      }

      db.createObjectStore(STORE_KEYS, { keyPath: "id" });
      const convStore = db.createObjectStore(STORE_CONVERSATIONS, { keyPath: "id", autoIncrement: true });
      convStore.createIndex("conversationId", "conversationId", { unique: false });
      db.createObjectStore(STORE_SESSION, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getStore = (db: IDBDatabase, storeName: string, mode: IDBTransactionMode = "readonly") => {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

const putItem = async (storeName: string, item: { id: string; [key: string]: unknown }) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const request = getStore(db, storeName, "readwrite").put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getItem = async <T>(storeName: string, id: string): Promise<T | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = getStore(db, storeName).get(id);
    request.onsuccess = () => resolve(request.result as T | null);
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName: string, id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const request = getStore(db, storeName, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = getStore(db, storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

export interface UserKeyPair {
  id: string;
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  tag: string;
  createdAt: string;
}

export interface ConversationKey {
  id: string;
  conversationId: string;
  key: string;
  keyVersion: number;
  createdAt: string;
}

export interface SessionState {
  id: string;
  initialized: boolean;
  lastSync: string;
  userId?: string;
}

export const saveUserKeyPair = async (keyPair: Omit<UserKeyPair, "id" | "createdAt">) => {
  await putItem(STORE_KEYS, {
    ...keyPair,
    id: "user",
    createdAt: new Date().toISOString(),
  });
};

export const getUserKeyPair = async (): Promise<UserKeyPair | null> => {
  return getItem<UserKeyPair>(STORE_KEYS, "user");
};

export const hasUsableUserKeyPair = (keyPair: UserKeyPair | null | undefined): keyPair is UserKeyPair => {
  return !!(
    keyPair &&
    typeof keyPair.publicKey === "string" &&
    keyPair.publicKey.trim() &&
    typeof keyPair.encryptedPrivateKey === "string" &&
    keyPair.encryptedPrivateKey.trim()
  );
};

export const saveConversationKey = async (key: Omit<ConversationKey, "id" | "createdAt">) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("conversations", "readwrite");
    const store = tx.objectStore("conversations");
    const index = store.index("conversationId");
    const request = index.getAll(key.conversationId);
    request.onsuccess = () => {
      const existing = request.result as ConversationKey[];
      const hasNewerOrEqual = existing.some((k) => k.keyVersion >= key.keyVersion);
      if (hasNewerOrEqual) {
        resolve();
        return;
      }
      const addRequest = store.add({
        ...key,
        createdAt: new Date().toISOString(),
      });
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getConversationKey = async (conversationId: string): Promise<ConversationKey | null> => {
  const keys = await getConversationKeys(conversationId);
  return keys[0] ?? null;
};

export const getConversationKeyByVersion = async (
  conversationId: string,
  keyVersion?: number | null
): Promise<ConversationKey | null> => {
  if (keyVersion == null) {
    return getConversationKey(conversationId);
  }

  const keys = await getConversationKeys(conversationId);
  return keys.find((key) => key.keyVersion === keyVersion) ?? null;
};

export const getConversationKeys = async (conversationId: string): Promise<ConversationKey[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("conversations", "readonly");
    const store = tx.objectStore("conversations");
    const index = store.index("conversationId");
    const request = index.getAll(conversationId);
    request.onsuccess = () => {
      const results = request.result as ConversationKey[];
      results.sort((a, b) => b.keyVersion - a.keyVersion);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteConversationKey = async (conversationId: string) => {
  await deleteItem("conversations", conversationId);
};

export const getAllConversationKeys = async (): Promise<ConversationKey[]> => {
  return getAllItems<ConversationKey>("conversations");
};

export const clearAllKeys = async () => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_KEYS, STORE_CONVERSATIONS, STORE_SESSION], "readwrite");
    tx.objectStore(STORE_KEYS).clear();
    tx.objectStore(STORE_CONVERSATIONS).clear();
    tx.objectStore(STORE_SESSION).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const needsMigration = async (): Promise<boolean> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_SESSION, "readonly");
    const store = tx.objectStore(STORE_SESSION);
    const request = store.get("migration_v1");
    request.onsuccess = () => resolve(!request.result);
    request.onerror = () => resolve(true);
  });
};

export const markMigrationComplete = async () => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSION, "readwrite");
    tx.objectStore(STORE_SESSION).put({ id: "migration_v1", completed: true, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const markSessionInitialized = async (userId?: string) => {
  await putItem(STORE_SESSION, {
    id: "session",
    initialized: true,
    lastSync: new Date().toISOString(),
    userId: userId ?? null,
  });
};

export const getSessionState = async (): Promise<SessionState | null> => {
  return getItem<SessionState>(STORE_SESSION, "session");
};
