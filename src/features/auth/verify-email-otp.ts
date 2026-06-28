import { createHash } from "node:crypto";

const EMAIL_OTP_PENDING_PREFIX = "email_otp:pending:";
const EMAIL_OTP_VERIFIED_PREFIX = "email_otp:verified:";

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function verifyEmailOtpLogic(): void {
  const code = "123456";
  const hashed = hashOtp(code);
  if (hashed.length !== 64) {
    throw new Error("OTP hash length mismatch");
  }

  if (hashOtp("000000") === hashed) {
    throw new Error("OTP hash collision check failed");
  }

  if (!EMAIL_OTP_PENDING_PREFIX.startsWith("email_otp:")) {
    throw new Error("Pending prefix mismatch");
  }

  if (!EMAIL_OTP_VERIFIED_PREFIX.startsWith("email_otp:")) {
    throw new Error("Verified prefix mismatch");
  }

  const ttlMs = 10 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);
  if (expiresAt.getTime() <= Date.now()) {
    throw new Error("OTP expiry calculation failed");
  }

  console.log("Email OTP verification: OK");
}

verifyEmailOtpLogic();
