"use server";

import { getLocale } from "next-intl/server";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
import { getHqState } from "../services/get-hq-state";
import {
  generateEmployeeThoughts,
  type EmployeeThoughtsMap,
} from "../services/generate-employee-thoughts";

/**
 * Produce LLM-generated lofi thoughts for the workspace roster. Cached with a
 * TTL in the service; `force` bypasses it (manual refresh). Returns {} on any
 * failure (including transient DB outages) so the floor silently falls back
 * to the curated pool.
 */
export async function generateHqThoughtsAction(
  force = false,
): Promise<EmployeeThoughtsMap> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );
    const locale = await getLocale();
    const state = await getHqState(workspace.organization.id);

    return await generateEmployeeThoughts({
      cacheKey: `${workspace.organization.id}:${locale}`,
      locale,
      employees: state.employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        status: employee.runtimeStatus,
      })),
      force,
    });
  } catch (error: unknown) {
    // This is a best-effort background action.
    // Transient database errors (Neon fetch failures, etc.) are expected
    // during brief connectivity hiccups — degrade silently.
    if (
      isTransientDatabaseError(error) ||
      (error instanceof Error &&
        error.message.includes("database temporarily unreachable"))
    ) {
      return {};
    }

    // Other failures (LLM provider, unexpected errors) also degrade.
    // Only surface in development for non-transient cases.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[HQ] generateHqThoughtsAction failed", error);
    }
    return {};
  }
}
