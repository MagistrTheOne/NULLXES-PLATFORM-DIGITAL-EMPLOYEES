import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getDataEncryptionKeyRing } from "@/shared/config/env";

/**
 * Field-level AES-256-GCM with versioned keys.
 *
 * Ciphertext format: `enc:v<N>:<base64(iv | ciphertext | tag)>` where N is
 * the key ring version the value was encrypted with. New values always use
 * the active (highest) version; decryption looks the version up in the ring,
 * so old rows survive a key rotation until they are re-encrypted.
 */
const PREFIX_PATTERN = /^enc:v(\d+):/;

function getKeyBuffer(version: number): Buffer {
  const ring = getDataEncryptionKeyRing();
  const key = ring.keys.get(version);

  if (!key) {
    throw new Error(
      `No field encryption key for version v${version}. ` +
        "Check DATA_ENCRYPTION_KEY / DATA_ENCRYPTION_KEYS.",
    );
  }

  return Buffer.from(key, "base64");
}

export function isEncryptedFieldValue(value: string | null | undefined): boolean {
  return Boolean(value && PREFIX_PATTERN.test(value));
}

function parseEncryptedVersion(value: string): number | null {
  const match = value.match(PREFIX_PATTERN);
  return match ? Number.parseInt(match[1], 10) : null;
}

/** True when the value is encrypted with a non-active key and should be re-encrypted. */
export function isStaleEncryptedFieldValue(
  value: string | null | undefined,
): boolean {
  if (!value) {
    return false;
  }

  const version = parseEncryptedVersion(value);
  if (version === null) {
    return false;
  }

  return version !== getDataEncryptionKeyRing().activeVersion;
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.length === 0) {
    return null;
  }

  if (isEncryptedFieldValue(plaintext)) {
    return plaintext;
  }

  const version = getDataEncryptionKeyRing().activeVersion;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeyBuffer(version), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, encrypted, tag]).toString("base64");

  return `enc:v${version}:${payload}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const version = parseEncryptedVersion(value);
  if (version === null) {
    return value;
  }

  const prefixLength = value.indexOf(":", "enc:v".length) + 1;
  const payload = Buffer.from(value.slice(prefixLength), "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(12, payload.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", getKeyBuffer(version), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

/** Decrypt and re-encrypt with the active key. Returns the input when already current. */
export function reencryptField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (!isStaleEncryptedFieldValue(value)) {
    return value;
  }

  return encryptField(decryptField(value));
}
