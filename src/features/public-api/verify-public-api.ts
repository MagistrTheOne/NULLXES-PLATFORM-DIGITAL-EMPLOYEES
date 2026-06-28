import { eq } from "drizzle-orm";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { createApiKey, revokeApiKey } from "@/features/security/services/api-key";
import { db } from "@/shared/db/client";

const TEST_USER_ID = "public-api-verify-user";

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Public API Verify User",
      email: "public-api-verify@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

function expectStatus(response: Response, status: number, label: string): void {
  if (response.status !== status) {
    throw new Error(`${label}: expected ${status}, got ${response.status}`);
  }
}

async function verifyPublicApi(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Public API Verify Org",
    slug: `public-api-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const readOnlyKey = await createApiKey({
    organizationId: org.id,
    name: "Verify Read Only",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "readOnly",
  });

  const adminKey = await createApiKey({
    organizationId: org.id,
    name: "Verify Admin",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "adminIntegration",
  });

  if (!readOnlyKey.ok || !adminKey.ok) {
    throw new Error("Failed to create verification API keys");
  }

  const missingAuth = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees"),
    ["employees:read"],
  );
  if (!(missingAuth instanceof Response)) {
    throw new Error("Missing auth should return Response");
  }
  expectStatus(missingAuth, 401, "Missing Bearer token");

  const invalidAuth = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: "Bearer nx_live_invalid" },
    }),
    ["employees:read"],
  );
  if (!(invalidAuth instanceof Response)) {
    throw new Error("Invalid key should return Response");
  }
  expectStatus(invalidAuth, 401, "Invalid API key");

  const readAllowed = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: `Bearer ${readOnlyKey.rawKey}` },
    }),
    ["employees:read"],
  );
  if (readAllowed instanceof Response) {
    throw new Error(`Read scope denied unexpectedly (${readAllowed.status})`);
  }
  if (readAllowed.organizationId !== org.id) {
    throw new Error("Read key resolved wrong organization");
  }

  const writeDenied = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: `Bearer ${readOnlyKey.rawKey}` },
    }),
    ["employees:write"],
  );
  if (!(writeDenied instanceof Response)) {
    throw new Error("Read-only key should not pass employees:write");
  }
  expectStatus(writeDenied, 403, "Insufficient scope");

  const writeAllowed = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: `Bearer ${adminKey.rawKey}` },
    }),
    ["employees:write"],
  );
  if (writeAllowed instanceof Response) {
    throw new Error(`Admin key denied employees:write (${writeAllowed.status})`);
  }

  const expiredKey = await createApiKey({
    organizationId: org.id,
    name: "Verify Expired",
    createdByUserId: TEST_USER_ID,
    scopeBundle: "adminIntegration",
    expiresAt: new Date(Date.now() - 60_000),
  });
  if (!expiredKey.ok) {
    throw new Error("Failed to create expired API key");
  }

  const expiredAuth = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: `Bearer ${expiredKey.rawKey}` },
    }),
    ["employees:read"],
  );
  if (!(expiredAuth instanceof Response)) {
    throw new Error("Expired key should be rejected");
  }
  expectStatus(expiredAuth, 401, "Expired API key");

  await revokeApiKey({ organizationId: org.id, keyId: readOnlyKey.keyId });
  await revokeApiKey({ organizationId: org.id, keyId: adminKey.keyId });
  await revokeApiKey({ organizationId: org.id, keyId: expiredKey.keyId });

  const revokedAuth = await authenticateApiKeyRequest(
    new Request("http://localhost/api/v1/employees", {
      headers: { authorization: `Bearer ${readOnlyKey.rawKey}` },
    }),
    ["employees:read"],
  );
  if (!(revokedAuth instanceof Response)) {
    throw new Error("Revoked key should be rejected");
  }
  expectStatus(revokedAuth, 401, "Revoked API key");

  console.log("Public API verification: OK");
}

verifyPublicApi().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Public API verification failed:", message);
  process.exit(1);
});
