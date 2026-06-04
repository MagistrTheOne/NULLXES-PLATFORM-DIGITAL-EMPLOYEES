import { parseSetCookieHeader } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { user } from "@/entities/user/schema";
import { getBetterAuthUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { auth } from "@/features/auth/server";
import { provisionDefaultWorkspace } from "@/features/auth/services/provision-default-workspace";
import { resolveWorkspace } from "@/features/workspace";

const VERIFY_PASSWORD = "NullxesDashboardShell123!";

function extractSessionCookieHeader(response: Response): string {
  const rawSetCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie().join(", ")
      : (response.headers.get("set-cookie") ?? "");

  const parsed = parseSetCookieHeader(rawSetCookie);
  const sessionToken = parsed.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    return "";
  }

  return `better-auth.session_token=${sessionToken}`;
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

async function verifyDashboardShell(): Promise<void> {
  const email = `dashboard-shell-${Date.now()}@nullxes.local`;
  const name = "Dashboard Shell Verify";

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
  console.log("Login flow: account registered");

  const signUpPayload = (await signUpResponse.json()) as {
    user?: { id?: string };
  };
  const signUpUserId = signUpPayload.user?.id;

  const [createdUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!createdUser) {
    throw new Error("Registered user was not persisted");
  }

  const provisionUserId = signUpUserId ?? createdUser.id;
  if (signUpUserId && signUpUserId !== createdUser.id) {
    throw new Error("Sign-up user id does not match persisted user record");
  }

  await provisionDefaultWorkspace(provisionUserId, name);

  const signInResponse = await callAuthEndpoint("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: VERIFY_PASSWORD,
      rememberMe: true,
    }),
  });

  if (!signInResponse.ok) {
    throw new Error(`Login failed (${signInResponse.status})`);
  }

  const sessionCookie = extractSessionCookieHeader(signInResponse);
  if (!sessionCookie) {
    throw new Error("Login did not issue a session cookie");
  }
  console.log("Login flow: session created");

  const sessionResponse = await callAuthEndpoint(
    "/api/auth/get-session",
    { method: "GET" },
    sessionCookie,
  );

  if (!sessionResponse.ok) {
    throw new Error("Session validation request failed");
  }

  const sessionPayload = (await sessionResponse.json()) as {
    user?: { id?: string; email?: string };
  } | null;

  if (
    !sessionPayload?.user?.id ||
    sessionPayload.user.id !== provisionUserId ||
    sessionPayload.user.email !== email
  ) {
    throw new Error("Session user does not match provisioned account");
  }
  console.log("Session: validated for dashboard access");

  const workspace = await resolveWorkspace({ userId: provisionUserId });
  console.log("Workspace: resolved");

  const baseURL = getBetterAuthUrl();
  let dashboardResponse: Response | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    dashboardResponse = await fetch(`${baseURL}/dashboard`, {
      headers: {
        cookie: sessionCookie,
        accept: "text/html",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });

    if (dashboardResponse.status === 200) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!dashboardResponse || dashboardResponse.status !== 200) {
    const status = dashboardResponse?.status ?? "no-response";
    const errorBody = dashboardResponse
      ? await dashboardResponse.text()
      : "";
    throw new Error(
      `Dashboard route returned ${status}: ${errorBody.slice(0, 400)}`,
    );
  }

  const dashboardHtml = await dashboardResponse.text();
  if (
    !dashboardHtml.includes(workspace.organization.name) ||
    !dashboardHtml.includes(createdUser.name) ||
    !dashboardHtml.includes(createdUser.email)
  ) {
    throw new Error("Dashboard shell did not render workspace and user context");
  }
  console.log("Dashboard shell: workspace and user rendered");

  const signOutResponse = await callAuthEndpoint(
    "/api/auth/sign-out",
    { method: "POST" },
    sessionCookie,
  );

  if (!signOutResponse.ok) {
    throw new Error(`Logout failed (${signOutResponse.status})`);
  }
  console.log("Logout: session destroyed");

  const dashboardAfterLogout = await fetch(`${baseURL}/dashboard`, {
    headers: {
      cookie: sessionCookie,
      accept: "text/html",
    },
    redirect: "manual",
  });

  if (dashboardAfterLogout.status < 300 || dashboardAfterLogout.status >= 400) {
    throw new Error(
      `Dashboard did not redirect after logout (${dashboardAfterLogout.status})`,
    );
  }
  console.log("Redirect behavior: protected route redirects when logged out");

  console.log("Dashboard shell verification: OK");
}

verifyDashboardShell().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Dashboard shell verification failed:", message);
  process.exit(1);
});
