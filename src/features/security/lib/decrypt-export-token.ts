import { decryptField } from "@/shared/crypto/field-encryption";

export function decryptExportDownloadToken(
  value: string | null | undefined,
): string | null {
  return decryptField(value);
}
