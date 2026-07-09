import { eq } from "drizzle-orm";
import { createOrganization } from "@/entities/organization/create-organization";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { createDigitalEmployee } from "@/features/employee";
import { createApiKey } from "@/features/security/services/api-key";
import { resolveAppBaseUrl } from "@/shared/config/env";
import { db } from "@/shared/db/client";

const TEST_USER_ID = "public-api-probe-user";

type ProbeResult = {
  method: string;
  path: string;
  status: number;
  ok: boolean;
  note?: string;
};

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Public API Probe User",
      email: "public-api-probe@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

async function waitForServer(baseUrl: string, attempts = 60): Promise<void> {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/docs`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Server not reachable at ${baseUrl}. Start it with: npm run dev`,
  );
}

async function probeRequest(input: {
  baseUrl: string;
  method: string;
  path: string;
  key?: string;
  body?: Record<string, unknown>;
}): Promise<ProbeResult> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (input.key) {
    headers.Authorization = `Bearer ${input.key}`;
  }

  if (input.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${input.baseUrl}${input.path}`, {
    method: input.method,
    headers,
    body: input.body ? JSON.stringify(input.body) : undefined,
  });

  let note: string | undefined;
  try {
    const payload = (await response.json()) as {
      error?: string;
      requestId?: string;
      data?: unknown;
    };
    if (payload.requestId) {
      note = `requestId=${payload.requestId}`;
    }
    if (payload.error) {
      note = [note, payload.error].filter(Boolean).join(" | ");
    }
    if (Array.isArray(payload.data)) {
      note = [note, `items=${payload.data.length}`].filter(Boolean).join(" | ");
    }
    if (
      payload.data &&
      typeof payload.data === "object" &&
      !Array.isArray(payload.data) &&
      "id" in payload.data
    ) {
      note = [note, `id=${String((payload.data as { id: string }).id)}`]
        .filter(Boolean)
        .join(" | ");
    }
  } catch {
    note = "non-json response";
  }

  return {
    method: input.method,
    path: input.path,
    status: response.status,
    ok: response.ok,
    note,
  };
}

async function probePublicApiHttp(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Public API Probe Org",
    slug: `public-api-probe-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  await db
    .update(organization)
    .set({ billingPlan: "scale" })
    .where(eq(organization.id, org.id));

  const employee = await createDigitalEmployee({
    organizationId: org.id,
    actorUserId: TEST_USER_ID,
    name: "Probe Employee",
    role: "API Test Employee",
    description: "Seeded for public API HTTP probe",
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt: "You are a probe employee for API testing.",
    reason: "Public API HTTP probe seed",
  });

  const adminKey = await createApiKey({
    organizationId: org.id,
    name: "Probe Admin Integration",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "adminIntegration",
  });

  const readOnlyKey = await createApiKey({
    organizationId: org.id,
    name: "Probe Read Only",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "readOnly",
  });

  const operatorKey = await createApiKey({
    organizationId: org.id,
    name: "Probe Workforce Operator",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "workforceOperator",
  });

  if (!adminKey.ok || !readOnlyKey.ok || !operatorKey.ok) {
    throw new Error("Failed to create probe API keys");
  }

  const baseUrl =
    process.env.PUBLIC_API_PROBE_BASE_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    resolveAppBaseUrl();

  console.log(`Probing ${baseUrl}`);
  console.log(`Organization: ${org.id}`);
  console.log(`Employee: ${employee.employee.id}`);
  console.log(`ADMIN_INTEGRATION_KEY=${adminKey.rawKey}`);
  console.log(`WORKFORCE_OPERATOR_KEY=${operatorKey.rawKey}`);
  console.log(`READ_ONLY_KEY=${readOnlyKey.rawKey}`);

  await waitForServer(baseUrl);

  const results: ProbeResult[] = [];

  results.push(
    await probeRequest({ baseUrl, method: "GET", path: "/api/docs" }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "GET",
      path: "/api/v1/employees",
      key: readOnlyKey.rawKey,
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "POST",
      path: "/api/v1/employees",
      key: adminKey.rawKey,
      body: {
        name: "API Probe Hire",
        role: "Automation Engineer",
        description: "Created by HTTP probe",
      },
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "GET",
      path: `/api/v1/employees/${employee.employee.id}`,
      key: readOnlyKey.rawKey,
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "PATCH",
      path: `/api/v1/employees/${employee.employee.id}`,
      key: adminKey.rawKey,
      body: { description: "Updated by HTTP probe" },
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "GET",
      path: "/api/v1/sessions?limit=5",
      key: readOnlyKey.rawKey,
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "POST",
      path: `/api/v1/employees/${employee.employee.id}/tasks`,
      key: operatorKey.rawKey,
      body: {
        title: "Probe task",
        message: "Queue this task from the HTTP probe script",
      },
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "POST",
      path: "/api/v1/workforce/assign",
      key: operatorKey.rawKey,
      body: {
        title: "Probe assign",
        message: "Route this inbound lead to the best sales employee",
      },
    }),
  );

  results.push(
    await probeRequest({
      baseUrl,
      method: "POST",
      path: "/api/v1/employees",
      key: readOnlyKey.rawKey,
      body: { name: "Should Fail", role: "Denied" },
    }),
  );

  const denied = results.at(-1);
  if (!denied || denied.status !== 403) {
    throw new Error("Expected read-only key to receive 403 on POST /employees");
  }

  for (const result of results.slice(0, -1)) {
    if (!result.ok) {
      throw new Error(
        `${result.method} ${result.path} failed with ${result.status}${result.note ? ` (${result.note})` : ""}`,
      );
    }
    console.log(
      `OK ${result.method} ${result.path} -> ${result.status}${result.note ? ` (${result.note})` : ""}`,
    );
  }

  console.log(
    `OK ${denied.method} ${denied.path} -> ${denied.status} (${denied.note ?? "scope denied"})`,
  );

  console.log("Public API HTTP probe: OK");
  console.log("Keys remain active for manual testing.");
}

probePublicApiHttp().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Public API HTTP probe failed:", message);
  process.exit(1);
});
