const DB_NAME = "e2ee-keys";
const DB_VERSION = 1;
const STORE_KEYS = "keys";
const STORE_CONVERSATIONS = "conversations";
const STORE_SESSION = "session";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        db.createObjectStore(STORE_CONVERSATIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SESSION)) {
        db.createObjectStore(STORE_SESSION, { keyPath: "id" });
      }
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

export const saveConversationKey = async (key: Omit<ConversationKey, "id" | "createdAt">) => {
  await putItem(STORE_CONVERSATIONS, {
    ...key,
    id: key.conversationId,
    createdAt: new Date().toISOString(),
  });
};

export const getConversationKey = async (conversationId: string): Promise<ConversationKey | null> => {
  return getItem<ConversationKey>(STORE_CONVERSATIONS, conversationId);
};

export const deleteConversationKey = async (conversationId: string) => {
  await deleteItem(STORE_CONVERSATIONS, conversationId);
};

export const getAllConversationKeys = async (): Promise<ConversationKey[]> => {
  return getAllItems<ConversationKey>(STORE_CONVERSATIONS);
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

export const markSessionInitialized = async () => {
  await putItem(STORE_SESSION, {
    id: "session",
    initialized: true,
    lastSync: new Date().toISOString(),
  });
};

export const getSessionState = async (): Promise<SessionState | null> => {
  return getItem<SessionState>(STORE_SESSION, "session");
};
