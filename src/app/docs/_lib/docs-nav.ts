export type DocsTocItem = { id: string; labelKey: string };

export type DocsNavItem = {
  href: string;
  /** Key under docs.nav.items.<key> */
  key: string;
  toc: DocsTocItem[];
};

export type DocsNavGroup = {
  /** Key under docs.nav.groups.<key> */
  key: string;
  items: DocsNavItem[];
};

/** Stripe / GitHub Enterprise style: one topic per page, platform not FAQ. */
export const DOCS_NAV: DocsNavGroup[] = [
  {
    key: "start",
    items: [
      {
        href: "/docs",
        key: "overview",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "domain", labelKey: "domain" },
          { id: "sections", labelKey: "sections" },
        ],
      },
      {
        href: "/docs/installation",
        key: "installation",
        toc: [
          { id: "requirements", labelKey: "requirements" },
          { id: "source", labelKey: "source" },
          { id: "env", labelKey: "env" },
          { id: "verify", labelKey: "verify" },
        ],
      },
      {
        href: "/docs/architecture",
        key: "architecture",
        toc: [
          { id: "stack", labelKey: "stack" },
          { id: "c4", labelKey: "c4" },
          { id: "flow", labelKey: "flow" },
          { id: "missions", labelKey: "missions" },
          { id: "erd", labelKey: "erd" },
        ],
      },
      {
        href: "/docs/assistant",
        key: "assistant",
        toc: [{ id: "assistant", labelKey: "assistant" }],
      },
    ],
  },
  {
    key: "workforce",
    items: [
      {
        href: "/docs/employees",
        key: "employees",
        toc: [
          { id: "model", labelKey: "model" },
          { id: "catalog", labelKey: "catalog" },
          { id: "lifecycle", labelKey: "lifecycle" },
        ],
      },
      {
        href: "/docs/talk",
        key: "talk",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "start", labelKey: "start" },
          { id: "limits", labelKey: "limits" },
          { id: "ready", labelKey: "ready" },
        ],
      },
      {
        href: "/docs/knowledge",
        key: "knowledge",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "upload", labelKey: "upload" },
          { id: "limits", labelKey: "limits" },
        ],
      },
      {
        href: "/docs/missions",
        key: "missions",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "runtime", labelKey: "runtime" },
        ],
      },
    ],
  },
  {
    key: "platform",
    items: [
      {
        href: "/docs/workspaces",
        key: "workspaces",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
      {
        href: "/docs/organizations",
        key: "organizations",
        toc: [
          { id: "model", labelKey: "model" },
          { id: "isolation", labelKey: "isolation" },
        ],
      },
      {
        href: "/docs/roles",
        key: "roles",
        toc: [
          { id: "roles", labelKey: "roles" },
          { id: "matrix", labelKey: "matrix" },
        ],
      },
      {
        href: "/docs/api",
        key: "api",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "auth", labelKey: "auth" },
          { id: "endpoints", labelKey: "endpoints" },
          { id: "responses", labelKey: "responses" },
        ],
      },
      {
        href: "/docs/api-keys",
        key: "apiKeys",
        toc: [
          { id: "create", labelKey: "create" },
          { id: "scopes", labelKey: "scopes" },
          { id: "revoke", labelKey: "revoke" },
        ],
      },
      {
        href: "/docs/webhooks",
        key: "webhooks",
        toc: [
          { id: "events", labelKey: "events" },
          { id: "signing", labelKey: "signing" },
          { id: "setup", labelKey: "setup" },
        ],
      },
      {
        href: "/docs/integrations",
        key: "integrations",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
    ],
  },
  {
    key: "admin",
    items: [
      {
        href: "/docs/plans",
        key: "plans",
        toc: [
          { id: "matrix", labelKey: "matrix" },
          { id: "api", labelKey: "api" },
        ],
      },
      {
        href: "/docs/limits",
        key: "limits",
        toc: [
          { id: "workforce", labelKey: "workforce" },
          { id: "talk", labelKey: "talk" },
          { id: "knowledge", labelKey: "knowledge" },
          { id: "api", labelKey: "api" },
        ],
      },
      {
        href: "/docs/analytics",
        key: "analytics",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
      {
        href: "/docs/audit",
        key: "audit",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
    ],
  },
  {
    key: "security",
    items: [
      {
        href: "/docs/security",
        key: "security",
        toc: [
          { id: "transport", labelKey: "transport" },
          { id: "access", labelKey: "access" },
          { id: "controls", labelKey: "controls" },
        ],
      },
      {
        href: "/docs/personal-data",
        key: "personalData",
        toc: [
          { id: "operator", labelKey: "operator" },
          { id: "categories", labelKey: "categories" },
          { id: "rights", labelKey: "rights" },
        ],
      },
      {
        href: "/docs/data-storage",
        key: "dataStorage",
        toc: [
          { id: "where", labelKey: "where" },
          { id: "retention", labelKey: "retention" },
        ],
      },
      {
        href: "/docs/api-security",
        key: "apiSecurity",
        toc: [
          { id: "keys", labelKey: "keys" },
          { id: "webhooks", labelKey: "webhooks" },
        ],
      },
      {
        href: "/docs/access-control",
        key: "accessControl",
        toc: [
          { id: "rbac", labelKey: "rbac" },
          { id: "isolation", labelKey: "isolation" },
        ],
      },
    ],
  },
  {
    key: "legal",
    items: [
      {
        href: "/docs/terms",
        key: "terms",
        toc: [{ id: "scope", labelKey: "scope" }],
      },
      {
        href: "/docs/offer",
        key: "offer",
        toc: [{ id: "subject", labelKey: "subject" }],
      },
      {
        href: "/docs/personal-data",
        key: "personalDataPolicy",
        toc: [{ id: "documents", labelKey: "documents" }],
      },
      {
        href: "/docs/privacy",
        key: "privacy",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
      {
        href: "/docs/cookies",
        key: "cookies",
        toc: [{ id: "overview", labelKey: "overview" }],
      },
      {
        href: "/docs/company",
        key: "company",
        toc: [{ id: "requisites", labelKey: "requisites" }],
      },
    ],
  },
  {
    key: "developers",
    items: [
      {
        href: "/docs/api",
        key: "publicApi",
        toc: [
          { id: "overview", labelKey: "overview" },
          { id: "auth", labelKey: "auth" },
          { id: "endpoints", labelKey: "endpoints" },
          { id: "responses", labelKey: "responses" },
        ],
      },
      {
        href: "/docs/webhooks",
        key: "webhooksDev",
        toc: [
          { id: "events", labelKey: "events" },
          { id: "signing", labelKey: "signing" },
        ],
      },
      {
        href: "/docs/changelog",
        key: "changelog",
        toc: [{ id: "recent", labelKey: "recent" }],
      },
    ],
  },
  {
    key: "enterprise",
    items: [
      {
        href: "/docs/enterprise",
        key: "enterprise",
        toc: [
          { id: "deployment", labelKey: "deployment" },
          { id: "identity", labelKey: "identity" },
          { id: "compliance", labelKey: "compliance" },
        ],
      },
    ],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap(
  (group) => group.items,
);

export function findDocsNavItem(pathname: string): DocsNavItem | undefined {
  // Prefer first match; legal group may share href with security personal-data.
  return DOCS_NAV_FLAT.find((item) => item.href === pathname);
}
