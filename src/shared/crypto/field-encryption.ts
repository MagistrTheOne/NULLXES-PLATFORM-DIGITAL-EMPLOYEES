import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getDataEncryptionKey } from "@/shared/config/env";

const PREFIX = "enc:v1:";

function getKeyBuffer(): Buffer {
  const key = getDataEncryptionKey();
  return Buffer.from(key, "base64");
}

export function isEncryptedFieldValue(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.length === 0) {
    return null;
  }

  if (isEncryptedFieldValue(plaintext)) {
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeyBuffer(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, encrypted, tag]).toString("base64");

  return `${PREFIX}${payload}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!isEncryptedFieldValue(value)) {
    return value;
  }

  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(12, payload.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", getKeyBuffer(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
