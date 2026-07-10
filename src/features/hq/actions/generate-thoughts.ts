"use server";

import { getLocale } from "next-intl/server";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
import { getHqState } from "../services/get-hq-state";
import {
  generateEmployeeThoughts,
  thoughtsContextFingerprint,
  type EmployeeThoughtsMap,
} from "../services/generate-employee-thoughts";

/**
 * Produce LLM-generated speech lines for the workspace roster, grounded in
 * each employee's live status / mission / task. Cached with a TTL; `force`
 * bypasses it. Returns {} on failure so the floor stays quiet (no curated
 * simulation quotes).
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

    const employees = state.employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      status: employee.runtimeStatus,
      activity:
        employee.activity.badge?.text ??
        employee.activity.badge?.key ??
        null,
      taskLabel: employee.task?.label ?? null,
      missionTitle: employee.mission?.title ?? null,
      missionStage: employee.mission?.stage ?? null,
      missionLastAction: employee.mission?.lastAction ?? null,
    }));

    const fingerprint = thoughtsContextFingerprint(employees);

    return await generateEmployeeThoughts({
      cacheKey: `${workspace.organization.id}:${locale}:${fingerprint}`,
      locale,
      employees,
      force,
    });
  } catch (error: unknown) {
    // Best-effort background action — degrade silently.
    if (
      isTransientDatabaseError(error) ||
      (error instanceof Error &&
        error.message.includes("database temporarily unreachable"))
    ) {
      return {};
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("[HQ] generateHqThoughtsAction failed", error);
    }
    return {};
  }
}
