const ALGO = { name: "AES-GCM", length: 256 };
const ECDH_ALGO = { name: "ECDH", namedCurve: "P-256" };
const IV_LENGTH = 12;

export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return crypto.subtle.generateKey(ECDH_ALGO, true, ["deriveKey", "deriveBits"]);
};

export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const raw = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

export const exportPrivateKey = async (key: CryptoKey): Promise<string> => {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

export const importPublicKey = async (base64: string): Promise<CryptoKey> => {
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("spki", binary, ECDH_ALGO, true, []);
};

export const importPrivateKey = async (base64: string): Promise<CryptoKey> => {
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", binary, ECDH_ALGO, true, ["deriveKey"]);
};

export const deriveSharedSecret = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  return crypto.subtle.deriveKey(
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
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(content);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  const encryptedBuffer = new Uint8Array(encrypted);
  const tag = encryptedBuffer.slice(-16);
  const cipherText = encryptedBuffer.slice(0, -16);

  return {
    cipherText: btoa(String.fromCharCode(...cipherText)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag)),
  };
};

export const decryptMessage = async (
  cipherText: string,
  iv: string,
  tag: string,
  aesKey: CryptoKey
): Promise<string> => {
  const cipherBuffer = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const tagBuffer = Uint8Array.from(atob(tag), (c) => c.charCodeAt(0));

  const combined = new Uint8Array(cipherBuffer.length + tagBuffer.length);
  combined.set(cipherBuffer);
  combined.set(tagBuffer, cipherBuffer.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    aesKey,
    combined
  );

  return new TextDecoder().decode(decrypted);
};

export const exportKeyAsBase64 = async (key: CryptoKey): Promise<string> => {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

export const importKeyFromBase64 = async (base64: string): Promise<CryptoKey> => {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, ALGO, false, ["encrypt", "decrypt"]);
};

export const generateAesKey = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(ALGO, true, ["encrypt", "decrypt"]);
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
  const rawKey = Uint8Array.from(atob(aesKeyBase64), (c) => c.charCodeAt(0));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedSecret,
    rawKey
  );

  const encryptedBuffer = new Uint8Array(encrypted);
  const tag = encryptedBuffer.slice(-16);
  const cipherText = encryptedBuffer.slice(0, -16);

  return JSON.stringify({
    cipherText: btoa(String.fromCharCode(...cipherText)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag)),
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

  const cipherBuffer = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const tagBuffer = Uint8Array.from(atob(tag), (c) => c.charCodeAt(0));

  const combined = new Uint8Array(cipherBuffer.length + tagBuffer.length);
  combined.set(cipherBuffer);
  combined.set(tagBuffer, cipherBuffer.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    sharedSecret,
    combined
  );

  return btoa(String.fromCharCode(...new Uint8Array(decrypted)));
};
