import { eq } from "drizzle-orm";
import { user } from "@/entities/user/schema";
import { getBetterAuthUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { account, session } from "./schema";
import { auth } from "./server";
import { GET, POST } from "./api/handler";

const VERIFY_PASSWORD = "NullxesAuthVerify123!";

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

  const request = new Request(`${baseURL}${path}`, {
    ...init,
    headers,
  });

  return auth.handler(request);
}

async function verifyAuth(): Promise<void> {
  if (!auth?.api) {
    throw new Error("Better Auth did not boot");
  }

  if (typeof GET !== "function" || typeof POST !== "function") {
    throw new Error("Auth API route handlers are not exported");
  }

  console.log("Better Auth: booted");

  const email = `auth-verify-${Date.now()}@nullxes.local`;
  const name = "NULLXES Auth Verify";

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
    throw new Error(`Sign up failed (${signUpResponse.status}): ${body}`);
  }
  console.log("Account: created");

  const [createdUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!createdUser) {
    throw new Error("User record was not created in database");
  }

  const [createdAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, createdUser.id))
    .limit(1);

  if (!createdAccount || createdAccount.providerId !== "credential") {
    throw new Error("Credential account record was not created in database");
  }
  console.log("Database records: user and account verified");

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
    throw new Error(`Sign in failed (${signInResponse.status}): ${body}`);
  }

  const sessionCookie = extractCookieHeader(signInResponse);
  if (!sessionCookie) {
    throw new Error("Session cookie was not issued on sign in");
  }
  console.log("Session: created");

  const [createdSession] = await db
    .select()
    .from(session)
    .where(eq(session.userId, createdUser.id))
    .limit(1);

  if (!createdSession) {
    throw new Error("Session record was not created in database");
  }

  const sessionResponse = await callAuthEndpoint(
    "/api/auth/get-session",
    { method: "GET" },
    sessionCookie,
  );

  if (!sessionResponse.ok) {
    const body = await sessionResponse.text();
    throw new Error(`Session validation failed (${sessionResponse.status}): ${body}`);
  }

  const sessionPayload = (await sessionResponse.json()) as {
    session?: { userId?: string };
    user?: { email?: string };
  };

  if (
    sessionPayload.user?.email !== email ||
    sessionPayload.session?.userId !== createdUser.id
  ) {
    throw new Error("Session validation returned unexpected identity");
  }
  console.log("Session: validated");

  const signOutResponse = await callAuthEndpoint(
    "/api/auth/sign-out",
    { method: "POST" },
    sessionCookie,
  );

  if (!signOutResponse.ok) {
    const body = await signOutResponse.text();
    throw new Error(`Sign out failed (${signOutResponse.status}): ${body}`);
  }
  console.log("Session: destroyed");

  const sessionAfterResponse = await callAuthEndpoint(
    "/api/auth/get-session",
    { method: "GET" },
    sessionCookie,
  );

  const sessionAfterPayload = (await sessionAfterResponse.json()) as {
    session?: unknown;
  } | null;

  if (sessionAfterPayload?.session) {
    throw new Error("Session still valid after sign out");
  }

  const sessionsAfterSignOut = await db
    .select()
    .from(session)
    .where(eq(session.userId, createdUser.id));

  console.log(
    `Database records after sign out: user=1 account=1 session_rows=${sessionsAfterSignOut.length}`,
  );

  console.log("Authentication verification: OK");
}

verifyAuth().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Authentication verification failed:", message);
  process.exit(1);
});
