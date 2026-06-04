import { eq } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { user } from "@/entities/user/schema";
import { createDigitalEmployee } from "@/features/employee";
import { provisionDefaultWorkspace } from "@/features/auth/services/provision-default-workspace";
import { resolveWorkspace } from "@/features/workspace";
import { getBetterAuthUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { auth } from "@/features/auth/server";
import { parseSetCookieHeader } from "better-auth/cookies";
import { listOrganizationEmployees } from "./services/list-organization-employees";

const VERIFY_PASSWORD = "NullxesEmployeesUi123!";

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
): Promise<Response> {
  const baseURL = getBetterAuthUrl();
  const headers = new Headers(init.headers);

  headers.set("origin", baseURL);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return auth.handler(
    new Request(`${baseURL}${path}`, {
      ...init,
      headers,
    }),
  );
}

async function verifyEmployeesUi(): Promise<void> {
  const email = `employees-ui-${Date.now()}@nullxes.local`;
  const name = "Employees UI Verify";

  const signUpResponse = await callAuthEndpoint("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password: VERIFY_PASSWORD,
    }),
  });

  if (!signUpResponse.ok) {
    throw new Error(`Register failed (${signUpResponse.status})`);
  }

  const [createdUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!createdUser) {
    throw new Error("Registered user was not persisted");
  }

  await provisionDefaultWorkspace(createdUser.id, name);

  const workspace = await resolveWorkspace({ userId: createdUser.id });

  const emptyEmployees = await listOrganizationEmployees(workspace.organization.id);
  if (emptyEmployees.length !== 0) {
    throw new Error("Expected empty employee list before creation");
  }
  console.log("Empty state: no employees in workspace");

  const created = await createDigitalEmployee({
    organizationId: workspace.organization.id,
    actorUserId: createdUser.id,
    name: "Somnia",
    role: "Enterprise Sales Employee",
    description: "Enterprise sales digital employee",
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt: "You are Somnia, an enterprise sales digital employee.",
  });

  await db.insert(knowledgeSource).values({
    employeeId: created.employee.id,
    type: "text",
    title: "Sales playbook",
    status: "ready",
  });

  const employees = await listOrganizationEmployees(workspace.organization.id);
  if (employees.length !== 1) {
    throw new Error(`Expected 1 employee, received ${employees.length}`);
  }

  const employee = employees[0]!;
  if (
    employee.name !== "Somnia" ||
    employee.status !== "draft" ||
    employee.avatarProvider !== "anam" ||
    employee.brainProvider !== "openai" ||
    employee.knowledgeSourcesCount !== 1
  ) {
    throw new Error("Employee list item did not match persisted entity");
  }
  console.log("Employee list: card fields resolved from database");

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
    throw new Error("Login did not issue session cookie");
  }

  const baseURL = getBetterAuthUrl();
  const pageResponse = await fetch(`${baseURL}/dashboard/employees`, {
    headers: {
      cookie: sessionCookie,
      accept: "text/html",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });

  if (pageResponse.status !== 200) {
    throw new Error(`Employees page returned ${pageResponse.status}`);
  }

  const html = await pageResponse.text();
  if (!html.includes("Digital Employees")) {
    throw new Error("Employees page did not render shell title");
  }

  const renderedMarkers = [
    "Somnia",
    "Enterprise Sales Employee",
    "Draft",
    "Avatar",
    "Brain",
    "knowledge source",
  ];
  const renderedCount = renderedMarkers.filter((marker) =>
    html.includes(marker),
  ).length;

  if (renderedCount < 3) {
    throw new Error(
      `Employees page HTML missing expected markers (${renderedCount}/${renderedMarkers.length})`,
    );
  }
  console.log("Employees page: route rendered employee UI markers");

  console.log("Digital employees UI verification: OK");
}

verifyEmployeesUi().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Digital employees UI verification failed:", message);
  process.exit(1);
});
