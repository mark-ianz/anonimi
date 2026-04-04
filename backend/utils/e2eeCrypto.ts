import crypto from "crypto";

const IV_LENGTH = 12;
const AES_ALGORITHM = "aes-256-gcm";

export const generateAesKey = (): Buffer => {
  return crypto.randomBytes(32);
};

export const encryptMessage = (
  content: string,
  aesKey: Buffer
): { cipherText: string; iv: string; tag: string } => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
};

export const decryptMessage = (
  cipherText: string,
  iv: string,
  tag: string,
  aesKey: Buffer
): string => {
  const decipher = crypto.createDecipheriv(
    AES_ALGORITHM,
    aesKey,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherText, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

export const encryptKeyForUser = (
  aesKey: Buffer,
  publicKeyPem: string
): string => {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );
  return encrypted.toString("base64");
};

export const decryptKeyForUser = (
  encryptedKeyBase64: string,
  privateKeyPem: string
): Buffer => {
  return crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encryptedKeyBase64, "base64")
  );
};
