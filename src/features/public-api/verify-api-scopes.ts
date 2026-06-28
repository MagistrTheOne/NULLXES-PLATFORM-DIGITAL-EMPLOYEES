import {
  API_SCOPE_BUNDLES,
  assertApiScopes,
  hasApiScope,
  resolveApiScopeBundle,
} from "@/features/public-api/lib/api-scopes";

function verifyApiScopes(): void {
  const readOnly = resolveApiScopeBundle("readOnly");
  if (!assertApiScopes(readOnly, ["employees:read"])) {
    throw new Error("Read-only bundle should allow employees:read");
  }

  if (assertApiScopes(readOnly, ["employees:write"])) {
    throw new Error("Read-only bundle must not allow employees:write");
  }

  const operator = resolveApiScopeBundle("workforceOperator");
  if (!assertApiScopes(operator, ["tasks:write", "sessions:read"])) {
    throw new Error("Workforce operator bundle missing expected scopes");
  }

  if (assertApiScopes(operator, ["employees:write"])) {
    throw new Error("Workforce operator bundle must not allow employees:write");
  }

  const admin = resolveApiScopeBundle("adminIntegration");
  if (!hasApiScope(admin, "employees:write")) {
    throw new Error("Admin integration bundle missing employees:write");
  }

  if (API_SCOPE_BUNDLES.adminIntegration.scopes.length !== 4) {
    throw new Error("Admin integration bundle scope count mismatch");
  }

  console.log("API scope verification: OK");
}

verifyApiScopes();
