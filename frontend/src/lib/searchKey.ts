const deriveHmacSearchKey = async (keyMaterialBase64: string): Promise<CryptoKey> => {
  const keyMaterialBytes = Uint8Array.from(atob(keyMaterialBase64), (c) => c.charCodeAt(0));

  const ikm = await crypto.subtle.importKey(
    "raw",
    keyMaterialBytes,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: new TextEncoder().encode("anonimi-search-v1"),
    },
    ikm,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
};

/**
 * Derives a stable HMAC search key from the user's EC private key.
 * Kept for compatibility with the earlier search implementation.
 */
export async function deriveSearchKey(pkcs8Base64: string): Promise<CryptoKey> {
  return deriveHmacSearchKey(pkcs8Base64);
}

/**
 * Derives a stable HMAC search key from the conversation's shared AES key.
 * All participants in the conversation derive the same search key.
 */
export async function deriveConversationSearchKey(
  conversationKeyBase64: string
): Promise<CryptoKey> {
  return deriveHmacSearchKey(conversationKeyBase64);
}

/**
 * Store the derived search key in memory after login.
 * Never persist this to localStorage or IndexedDB.
 */
let _searchKey: CryptoKey | null = null;

export function setSearchKey(key: CryptoKey) {
  _searchKey = key;
}

export function getSearchKey(): CryptoKey {
  if (!_searchKey) throw new Error("Search key not initialised - call deriveSearchKey first");
  return _searchKey;
}
