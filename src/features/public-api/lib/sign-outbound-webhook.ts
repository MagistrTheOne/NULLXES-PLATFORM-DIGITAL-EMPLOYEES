import { createHmac, timingSafeEqual } from "node:crypto";

export function signOutboundWebhookPayload(input: {
  secret: string;
  timestamp: string;
  body: string;
}): string {
  const payload = `${input.timestamp}.${input.body}`;
  return createHmac("sha256", input.secret).update(payload).digest("hex");
}

export function verifyOutboundWebhookSignature(input: {
  secret: string;
  timestamp: string;
  body: string;
  signature: string;
}): boolean {
  const expected = signOutboundWebhookPayload(input);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(input.signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
