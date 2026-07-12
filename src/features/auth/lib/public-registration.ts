import { lookupOrganizationInviteByToken } from "@/features/team/services/lookup-organization-invite";

export const INVITE_TOKEN_HEADER = "x-nullxes-invite-token";

/**
 * Public self-serve registration.
 * Default: closed. Set PUBLIC_REGISTRATION_ENABLED=true to reopen for everyone.
 */
export function isPublicRegistrationEnabled(): boolean {
  return process.env.PUBLIC_REGISTRATION_ENABLED?.trim() === "true";
}

/** Comma/space-separated emails that may self-register while public is closed. */
export function getRegistrationAllowlist(): string[] {
  const raw = process.env.REGISTRATION_ALLOWLIST?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasRegistrationAllowlist(): boolean {
  return getRegistrationAllowlist().length > 0;
}

export function isRegistrationAllowlisted(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return getRegistrationAllowlist().includes(normalized);
}

/**
 * UI: show the register form when public is open, allowlist mode is on,
 * or a pending invite token is present.
 */
export function canShowRegisterForm(input: {
  inviteToken?: string | null;
}): boolean {
  if (isPublicRegistrationEnabled()) {
    return true;
  }
  if (input.inviteToken?.trim()) {
    return true;
  }
  return hasRegistrationAllowlist();
}

export type SignUpAuthorization =
  | { ok: true; reason: "public" | "allowlist" | "invite" }
  | { ok: false; message: string };

/**
 * API gate for POST /api/auth/sign-up/email while public registration is closed.
 */
export async function authorizeEmailSignUp(input: {
  email: string;
  inviteToken?: string | null;
}): Promise<SignUpAuthorization> {
  if (isPublicRegistrationEnabled()) {
    return { ok: true, reason: "public" };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: "Email is required for registration." };
  }

  if (isRegistrationAllowlisted(email)) {
    return { ok: true, reason: "allowlist" };
  }

  const inviteToken = input.inviteToken?.trim();
  if (inviteToken) {
    const invite = await lookupOrganizationInviteByToken(inviteToken);
    if (!invite) {
      return {
        ok: false,
        message: "Invite is invalid or expired.",
      };
    }
    if (invite.email.trim().toLowerCase() !== email) {
      return {
        ok: false,
        message: "Use the email address from your invitation.",
      };
    }
    return { ok: true, reason: "invite" };
  }

  return {
    ok: false,
    message:
      "Public registration is closed. Use an invite link or an approved email.",
  };
}
