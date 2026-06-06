import {
  decryptField,
  encryptField,
  isEncryptedFieldValue,
} from "@/shared/crypto/field-encryption";

export function encryptIntegrationToken(
  token: string | null | undefined,
): string | null {
  return encryptField(token);
}

export function decryptIntegrationToken(
  value: string | null | undefined,
): string | null {
  return decryptField(value);
}

export function isEncryptedIntegrationToken(
  value: string | null | undefined,
): boolean {
  return isEncryptedFieldValue(value);
}

export function encryptIntegrationConnectionTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: encryptIntegrationToken(input.accessToken),
    refreshToken: encryptIntegrationToken(input.refreshToken),
  };
}

export function decryptIntegrationConnectionTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: decryptIntegrationToken(input.accessToken),
    refreshToken: decryptIntegrationToken(input.refreshToken),
  };
}
