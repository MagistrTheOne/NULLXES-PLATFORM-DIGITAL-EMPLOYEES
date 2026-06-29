import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}

export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "NULLXES <noreply@www.nullxesdai.online>"
  );
}

/** True when transactional email (Resend) is configured for this deployment. */
export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
