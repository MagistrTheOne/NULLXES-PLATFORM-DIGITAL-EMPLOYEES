export const API_SCOPES = [
  "employees:read",
  "employees:write",
  "sessions:read",
  "tasks:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const API_SCOPE_BUNDLES = {
  readOnly: {
    label: "Read-only",
    description: "List employees and sessions.",
    scopes: ["employees:read", "sessions:read"] satisfies ApiScope[],
  },
  workforceOperator: {
    label: "Workforce Operator",
    description: "Read workforce data and enqueue tasks.",
    scopes: ["employees:read", "sessions:read", "tasks:write"] satisfies ApiScope[],
  },
  adminIntegration: {
    label: "Admin Integration",
    description: "Full workforce automation access.",
    scopes: [...API_SCOPES] satisfies ApiScope[],
  },
} as const;

export type ApiScopeBundleId = keyof typeof API_SCOPE_BUNDLES;

export function resolveApiScopeBundle(bundleId: ApiScopeBundleId): ApiScope[] {
  return [...API_SCOPE_BUNDLES[bundleId].scopes];
}

/** Bundles the org may create for a given plan API access level. */
export function bundlesForApiAccess(
  access: "none" | "read" | "full",
): ApiScopeBundleId[] {
  if (access === "none") return [];
  if (access === "read") return ["readOnly"];
  return ["readOnly", "workforceOperator", "adminIntegration"];
}

/** Infer create-key bundle from stored scopes (for rotate). */
export function inferApiScopeBundle(
  scopes: readonly string[],
): ApiScopeBundleId {
  if (scopes.includes("employees:write")) return "adminIntegration";
  if (scopes.includes("tasks:write")) return "workforceOperator";
  return "readOnly";
}

export function hasApiScope(
  grantedScopes: readonly string[],
  requiredScope: ApiScope,
): boolean {
  return grantedScopes.includes(requiredScope);
}

export function assertApiScopes(
  grantedScopes: readonly string[],
  requiredScopes: readonly ApiScope[],
): boolean {
  return requiredScopes.every((scope) => hasApiScope(grantedScopes, scope));
}
