import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { user } from "@/entities/user/schema";
import { verification } from "@/features/auth/schema";
import { db } from "@/shared/db/client";
import { isEmailDeliveryConfigured } from "@/shared/email/resend-client";
import { isEmailOtpStepUpEnabled } from "../lib/email-otp-feature";
import { shouldBypassEmailOtp } from "../lib/email-otp-bypass";
import { sendEmailOtpMessage } from "../lib/send-email-otp";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export const EMAIL_OTP_PENDING_PREFIX = "email_otp:pending:";
/** @deprecated Kept for purge/cleanup of legacy step-up rows. */
export const EMAIL_OTP_VERIFIED_PREFIX = "email_otp:verified:";

/**
 * Post-login OTP gate — only when explicitly enabled AND Resend is configured.
 * Set EMAIL_OTP_STEP_UP_ENABLED=true when Resend is configured for this env.
 *
 * Once the account has `emailVerified=true` (registration link or this OTP),
 * the gate never asks again.
 */
export function isEmailOtpEnabled(): boolean {
  return isEmailOtpStepUpEnabled() && isEmailDeliveryConfigured();
}

/** True when this user must complete the one-time email OTP gate. */
export function isEmailOtpRequiredForUser(email: string): boolean {
  if (!isEmailOtpEnabled()) {
    return false;
  }

  return !shouldBypassEmailOtp(email);
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function pendingIdentifier(userId: string): string {
  return `${EMAIL_OTP_PENDING_PREFIX}${userId}`;
}

function verifiedIdentifier(userId: string): string {
  return `${EMAIL_OTP_VERIFIED_PREFIX}${userId}`;
}

/**
 * Account already proved email ownership (Better Auth verification or prior OTP).
 */
export async function hasVerifiedEmailOtp(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return Boolean(row?.emailVerified);
}

export async function requestEmailOtp(input: {
  userId: string;
  email: string;
}): Promise<
  | { ok: true; emailSent: boolean; devCode?: string }
  | { ok: false; message: string; retryAfterSeconds?: number }
> {
  if (await hasVerifiedEmailOtp(input.userId)) {
    return { ok: true, emailSent: false };
  }

  const identifier = pendingIdentifier(input.userId);
  const now = new Date();

  const [existing] = await db
    .select({
      id: verification.id,
      createdAt: verification.createdAt,
    })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, identifier),
        gt(verification.expiresAt, now),
      ),
    )
    .orderBy(desc(verification.createdAt))
    .limit(1);

  if (existing) {
    const elapsedMs = now.getTime() - existing.createdAt.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - elapsedMs) / 1000,
      );
      return {
        ok: false,
        message: "Please wait before requesting another code.",
        retryAfterSeconds,
      };
    }
  }

  // Drop all pending rows for this user so concurrent auto-sends cannot leave
  // multiple hashes (verify would then miss the code from the email).
  await db.delete(verification).where(eq(verification.identifier, identifier));

  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await db.insert(verification).values({
    id: `${input.userId}-${now.getTime()}-${randomInt(0, 1_000_000)}`,
    identifier,
    value: hashOtp(code),
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const delivery = await sendEmailOtpMessage({
    email: input.email,
    code,
  });

  if (!delivery.sent) {
    await db.delete(verification).where(eq(verification.identifier, identifier));
    const devCode =
      process.env.NODE_ENV === "development" ? code : undefined;

    if (devCode) {
      return {
        ok: true,
        emailSent: false,
        devCode,
      };
    }

    return {
      ok: false,
      message:
        delivery.error ??
        "Unable to send verification email. Check Resend configuration and try again.",
    };
  }

  return {
    ok: true,
    emailSent: true,
  };
}

export async function verifyEmailOtp(input: {
  userId: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = input.code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, message: "Enter the 6-digit verification code." };
  }

  if (await hasVerifiedEmailOtp(input.userId)) {
    return { ok: true };
  }

  const identifier = pendingIdentifier(input.userId);
  const now = new Date();
  const codeHash = hashOtp(trimmed);

  const pendingRows = await db
    .select({
      id: verification.id,
      value: verification.value,
      expiresAt: verification.expiresAt,
    })
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .orderBy(desc(verification.createdAt));

  if (pendingRows.length === 0) {
    return { ok: false, message: "No active verification code. Request a new one." };
  }

  const match = pendingRows.find(
    (row) =>
      row.expiresAt.getTime() > now.getTime() && row.value === codeHash,
  );

  if (!match) {
    const anyUnexpired = pendingRows.some(
      (row) => row.expiresAt.getTime() > now.getTime(),
    );
    if (!anyUnexpired) {
      await db.delete(verification).where(eq(verification.identifier, identifier));
      return { ok: false, message: "Verification code expired. Request a new one." };
    }
    return { ok: false, message: "Invalid verification code." };
  }

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db
    .delete(verification)
    .where(eq(verification.identifier, verifiedIdentifier(input.userId)));

  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: now })
    .where(eq(user.id, input.userId));

  return { ok: true };
}

export async function purgeExpiredEmailOtpRecords(): Promise<void> {
  const now = new Date();
  await db.delete(verification).where(lt(verification.expiresAt, now));
}
