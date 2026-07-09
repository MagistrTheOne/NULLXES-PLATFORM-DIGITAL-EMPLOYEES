import { and, desc, eq, ilike } from "drizzle-orm";
import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { db } from "@/shared/db/client";

export type DocsAssistantProfile = {
  name: string;
  role: string;
  avatarUrl: string | null;
  initials: string;
};

const FALLBACK: DocsAssistantProfile = {
  name: "Yuki Nakora",
  role: "Документация · LLM",
  avatarUrl: null,
  initials: "YN",
};

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function readAvatarPreviewUrl(
  config: Record<string, unknown> | null | undefined,
): string | null {
  if (!config) {
    return null;
  }

  const avatar = config as AvatarProviderConfigPayload;
  const url = avatar.previewUrl ?? avatar.imageUrl ?? null;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export async function getDocsAssistantProfile(): Promise<DocsAssistantProfile> {
  const rows = await db
    .select({
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      config: employeeProviderConfig.config,
    })
    .from(digitalEmployee)
    .innerJoin(
      employeeProviderConfig,
      and(
        eq(employeeProviderConfig.employeeId, digitalEmployee.id),
        eq(employeeProviderConfig.providerType, "avatar"),
      ),
    )
    .where(
      and(
        eq(digitalEmployee.status, "active"),
        ilike(digitalEmployee.name, "Yuki%"),
      ),
    )
    .orderBy(desc(digitalEmployee.createdAt))
    .limit(5);

  for (const row of rows) {
    const avatarUrl = readAvatarPreviewUrl(row.config);
    if (avatarUrl) {
      return {
        name: row.name,
        role: row.role,
        avatarUrl,
        initials: buildInitials(row.name),
      };
    }
  }

  const [first] = rows;
  if (first) {
    return {
      name: first.name,
      role: first.role,
      avatarUrl: readAvatarPreviewUrl(first.config),
      initials: buildInitials(first.name),
    };
  }

  return FALLBACK;
}
