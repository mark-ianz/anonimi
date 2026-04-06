const ALGO = { name: "AES-GCM", length: 256 };
const ECDH_ALGO = { name: "ECDH", namedCurve: "P-256" };
const IV_LENGTH = 12;

/**
 * Safely get the Web Crypto object to avoid SSR errors in Next.js
 */
const getCrypto = (): Crypto => {
  if (typeof window !== "undefined" && window.crypto) return window.crypto;
  if (typeof globalThis !== "undefined" && globalThis.crypto) return globalThis.crypto;
  throw new Error("Web Crypto API is not available in this environment.");
};

const getSubtle = (): SubtleCrypto => {
  const crypto = getCrypto();
  if (!crypto.subtle) {
    throw new Error("Web Crypto Subtle API is not available (likely an insecure context).");
  }
  return crypto.subtle;
};

/**
 * Robust base64 to Uint8Array conversion (handles large buffers)
 */
const base64ToBytes = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Robust Uint8Array to base64 conversion (handles large buffers)
 */
const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return getSubtle().generateKey(ECDH_ALGO, true, ["deriveKey", "deriveBits"]);
};

export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const raw = await getSubtle().exportKey("spki", key);
  return bytesToBase64(new Uint8Array(raw));
};

export const exportPrivateKey = async (key: CryptoKey): Promise<string> => {
  const raw = await getSubtle().exportKey("pkcs8", key);
  return bytesToBase64(new Uint8Array(raw));
};

export const importPublicKey = async (base64: string): Promise<CryptoKey> => {
  const binary = base64ToBytes(base64);
  return getSubtle().importKey("spki", binary as any, ECDH_ALGO, true, []);
};

export const importPrivateKey = async (base64: string): Promise<CryptoKey> => {
  const binary = base64ToBytes(base64);
  return getSubtle().importKey("pkcs8", binary as any, ECDH_ALGO, true, ["deriveKey", "deriveBits"]);
};

export const deriveSharedSecret = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  return getSubtle().deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    ALGO,
    true,
    ["encrypt", "decrypt"]
  );
};

export const deriveSharedSecretFromBase64 = async (
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<CryptoKey> => {
  const privateKey = await importPrivateKey(privateKeyBase64);
  const publicKey = await importPublicKey(publicKeyBase64);
  return deriveSharedSecret(privateKey, publicKey);
};

export const encryptMessage = async (
  content: string,
  aesKey: CryptoKey
): Promise<{ cipherText: string; iv: string; tag: string }> => {
  const iv = getCrypto().getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(content);

  const encrypted = await getSubtle().encrypt(
    { name: "AES-GCM", iv: iv as any, tagLength: 128 },
    aesKey,
    encoded as any
  );

  const encryptedBuffer = new Uint8Array(encrypted);
  const tag = encryptedBuffer.slice(-16);
  const cipherText = encryptedBuffer.slice(0, -16);

  return {
    cipherText: bytesToBase64(cipherText),
    iv: bytesToBase64(iv),
    tag: bytesToBase64(tag),
  };
};

export const decryptMessage = async (
  cipherText: string,
  iv: string,
  tag: string,
  aesKey: CryptoKey
): Promise<string> => {
  const cipherBuffer = base64ToBytes(cipherText);
  const ivBuffer = base64ToBytes(iv);
  const tagBuffer = base64ToBytes(tag);

  const combined = new Uint8Array(cipherBuffer.length + tagBuffer.length);
  combined.set(cipherBuffer);
  combined.set(tagBuffer, cipherBuffer.length);

  const decrypted = await getSubtle().decrypt(
    { name: "AES-GCM", iv: ivBuffer as any, tagLength: 128 },
    aesKey,
    combined as any
  );

  return new TextDecoder().decode(decrypted);
};

export const exportKeyAsBase64 = async (key: CryptoKey): Promise<string> => {
  const raw = await getSubtle().exportKey("raw", key);
  return bytesToBase64(new Uint8Array(raw));
};

export const importKeyFromBase64 = async (base64: string): Promise<CryptoKey> => {
  const raw = base64ToBytes(base64);
  return getSubtle().importKey("raw", raw as any, ALGO, false, ["encrypt", "decrypt"]);
};

export const generateAesKey = async (): Promise<CryptoKey> => {
  return getSubtle().generateKey(ALGO, true, ["encrypt", "decrypt"]);
};

export const encryptKeyWithSharedSecret = async (
  aesKeyBase64: string,
  myPrivateKeyBase64: string,
  theirPublicKeyBase64: string
): Promise<string> => {
  const sharedSecret = await deriveSharedSecretFromBase64(
    myPrivateKeyBase64,
    theirPublicKeyBase64
  );
  const rawKey = base64ToBytes(aesKeyBase64);
  const iv = getCrypto().getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await getSubtle().encrypt(
    { name: "AES-GCM", iv: iv as any, tagLength: 128 },
    sharedSecret,
    rawKey as any
  );

  const encryptedBuffer = new Uint8Array(encrypted);
  const tag = encryptedBuffer.slice(-16);
  const cipherText = encryptedBuffer.slice(0, -16);

  return JSON.stringify({
    cipherText: bytesToBase64(cipherText),
    iv: bytesToBase64(iv),
    tag: bytesToBase64(tag),
  });
};

export const decryptKeyWithSharedSecret = async (
  encryptedPayloadJson: string,
  myPrivateKeyBase64: string,
  theirPublicKeyBase64: string
): Promise<string> => {
  const { cipherText, iv, tag } = JSON.parse(encryptedPayloadJson);
  const sharedSecret = await deriveSharedSecretFromBase64(
    myPrivateKeyBase64,
    theirPublicKeyBase64
  );

  const cipherBuffer = base64ToBytes(cipherText);
  const ivBuffer = base64ToBytes(iv);
  const tagBuffer = base64ToBytes(tag);

  const combined = new Uint8Array(cipherBuffer.length + tagBuffer.length);
  combined.set(cipherBuffer);
  combined.set(tagBuffer, cipherBuffer.length);

  const decrypted = await getSubtle().decrypt(
    { name: "AES-GCM", iv: ivBuffer as any, tagLength: 128 },
    sharedSecret,
    combined as any
  );

  return bytesToBase64(new Uint8Array(decrypted));
};
