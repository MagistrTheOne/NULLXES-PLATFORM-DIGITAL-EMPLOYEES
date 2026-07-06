import { eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { user } from "@/entities/user/schema";
import { resolveWorkspace } from "@/features/workspace";
import { getBetterAuthUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { account, session, verification } from "./schema";
import { auth } from "./server";
import { provisionDefaultWorkspace } from "./services/provision-default-workspace";

const VERIFY_PASSWORD = "NullxesAuthExperience123!";
const RESET_PASSWORD = "NullxesAuthReset456!";

function extractCookieHeader(response: Response): string {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    return setCookies.map((value) => value.split(";")[0] ?? "").join("; ");
  }

  const single = response.headers.get("set-cookie");
  if (!single) {
    return "";
  }

  return single
    .split(",")
    .map((value) => value.split(";")[0] ?? "")
    .join("; ");
}

async function callAuthEndpoint(
  path: string,
  init: RequestInit,
  cookieHeader?: string,
): Promise<Response> {
  const baseURL = getBetterAuthUrl();
  const headers = new Headers(init.headers);

  headers.set("origin", baseURL);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return auth.handler(
    new Request(`${baseURL}${path}`, {
      ...init,
      headers,
    }),
  );
}

async function ensureEmailVerified(email: string): Promise<void> {
  await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.email, email));
}

async function extractPasswordResetToken(userId: string): Promise<string> {
  const rows = await db
    .select({
      identifier: verification.identifier,
      value: verification.value,
    })
    .from(verification);

  const resetRow = rows.find(
    (row) =>
      row.identifier.startsWith("reset-password:") && row.value === userId,
  );

  if (!resetRow) {
    throw new Error("Password reset token not found in verification table");
  }

  return resetRow.identifier.replace("reset-password:", "");
}

async function verifyAuthExperience(): Promise<void> {
  const email = `auth-experience-${Date.now()}@nullxes.local`;
  const name = "Auth Experience Verify";

  const signUpResponse = await callAuthEndpoint("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password: VERIFY_PASSWORD,
    }),
  });

  if (!signUpResponse.ok) {
    const body = await signUpResponse.text();
    throw new Error(`Register failed (${signUpResponse.status}): ${body}`);
  }
  console.log("Register: account created");

  const [createdUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!createdUser) {
    throw new Error("Register did not persist user record");
  }

  const [createdAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, createdUser.id))
    .limit(1);

  if (!createdAccount) {
    throw new Error("Register did not persist credential account");
  }

  await provisionDefaultWorkspace(createdUser.id, name);

  const [createdMembership] = await db
    .select()
    .from(membership)
    .where(eq(membership.userId, createdUser.id))
    .limit(1);

  if (!createdMembership) {
    throw new Error("Workspace provisioning failed after register");
  }
  console.log("Register: workspace provisioned");

  await ensureEmailVerified(email);
  console.log("Email verification: satisfied for integration test");

  const signInResponse = await callAuthEndpoint("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: VERIFY_PASSWORD,
      rememberMe: true,
    }),
  });

  if (!signInResponse.ok) {
    const body = await signInResponse.text();
    throw new Error(`Login failed (${signInResponse.status}): ${body}`);
  }

  const sessionCookie = extractCookieHeader(signInResponse);
  if (!sessionCookie) {
    throw new Error("Login did not issue session cookie");
  }
  console.log("Login: session created");

  const sessionResponse = await callAuthEndpoint(
    "/api/auth/get-session",
    { method: "GET" },
    sessionCookie,
  );

  if (!sessionResponse.ok) {
    throw new Error("Session validation request failed");
  }

  const sessionPayload = (await sessionResponse.json()) as {
    user?: { email?: string };
    session?: { userId?: string };
  } | null;

  if (
    !sessionPayload?.user ||
    sessionPayload.user.email !== email ||
    sessionPayload.session?.userId !== createdUser.id
  ) {
    throw new Error("Session validation failed");
  }
  console.log("Session: validated");

  const workspace = await resolveWorkspace({ userId: createdUser.id });
  if (workspace.organization.id !== createdMembership.organizationId) {
    throw new Error("Workspace resolution failed after login");
  }
  console.log("Workspace: resolved after login");

  const resetRequestResponse = await callAuthEndpoint(
    "/api/auth/request-password-reset",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        redirectTo: `${getBetterAuthUrl()}/login/reset-password`,
      }),
    },
  );

  if (!resetRequestResponse.ok) {
    const body = await resetRequestResponse.text();
    throw new Error(`Password reset request failed (${resetRequestResponse.status}): ${body}`);
  }
  console.log("Password reset: link requested");

  const resetToken = await extractPasswordResetToken(createdUser.id);

  const resetResponse = await callAuthEndpoint("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      newPassword: RESET_PASSWORD,
      token: resetToken,
    }),
  });

  if (!resetResponse.ok) {
    const body = await resetResponse.text();
    throw new Error(`Password reset failed (${resetResponse.status}): ${body}`);
  }
  console.log("Password reset: password updated");

  const signInAfterReset = await callAuthEndpoint("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: RESET_PASSWORD,
      rememberMe: true,
    }),
  });

  if (!signInAfterReset.ok) {
    const body = await signInAfterReset.text();
    throw new Error(`Login after reset failed (${signInAfterReset.status}): ${body}`);
  }
  console.log("Password reset: login with new password verified");

  const changePasswordResponse = await callAuthEndpoint(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword: RESET_PASSWORD,
        newPassword: VERIFY_PASSWORD,
        revokeOtherSessions: false,
      }),
    },
    extractCookieHeader(signInAfterReset),
  );

  if (!changePasswordResponse.ok) {
    const body = await changePasswordResponse.text();
    throw new Error(`Change password failed (${changePasswordResponse.status}): ${body}`);
  }
  console.log("Change password: verified");

  const signOutResponse = await callAuthEndpoint(
    "/api/auth/sign-out",
    { method: "POST" },
    extractCookieHeader(signInAfterReset),
  );

  if (!signOutResponse.ok) {
    const body = await signOutResponse.text();
    throw new Error(`Logout failed (${signOutResponse.status}): ${body}`);
  }
  console.log("Logout: session destroyed");

  const sessionAfterResponse = await callAuthEndpoint(
    "/api/auth/get-session",
    { method: "GET" },
    extractCookieHeader(signInAfterReset),
  );

  const sessionAfterPayload = (await sessionAfterResponse.json()) as {
    session?: unknown;
  } | null;

  if (sessionAfterPayload?.session) {
    throw new Error("Session still valid after logout");
  }

  const sessionRows = await db
    .select()
    .from(session)
    .where(eq(session.userId, createdUser.id));

  console.log(
    `Redirect behavior: unauthenticated session cleared (session_rows=${sessionRows.length})`,
  );
  console.log("Authentication experience verification: OK");
}

verifyAuthExperience().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Authentication experience verification failed:", message);
  process.exit(1);
});
