"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { createKnowledgeSource } from "@/features/knowledge-processing";
import {
  fetchKnowledgeUrlContent,
  normalizeKnowledgeTextContent,
} from "@/features/knowledge-processing/lib/extract-knowledge-content";
import { db } from "@/shared/db/client";

export type AddEmployeeKnowledgeResult =
  | { ok: true; sourceId: string }
  | { ok: false; message: string };

async function assertEmployeeAccess(
  organizationId: string,
  employeeId: string,
): Promise<boolean> {
  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, employeeId),
        eq(digitalEmployee.organizationId, organizationId),
      ),
    )
    .limit(1);

  return Boolean(employee);
}

export async function addEmployeeKnowledgeTextAction(input: {
  employeeId: string;
  content: string;
}): Promise<AddEmployeeKnowledgeResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );
    const employeeId = input.employeeId.trim();
    const content = input.content.trim();

    if (!employeeId || !content) {
      return { ok: false, message: "Employee and text content are required." };
    }

    const allowed = await assertEmployeeAccess(
      workspace.organization.id,
      employeeId,
    );
    if (!allowed) {
      return { ok: false, message: "Employee not found." };
    }

    const normalized = normalizeKnowledgeTextContent(content);
    const created = await createKnowledgeSource({
      employeeId,
      type: "text",
      title: normalized.slice(0, 160),
      chunks: [{ content: normalized }],
    });

    revalidatePath(`/dashboard/employees/${employeeId}`);
    return { ok: true, sourceId: created.source.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to add knowledge.",
    };
  }
}

export async function addEmployeeKnowledgeUrlAction(input: {
  employeeId: string;
  url: string;
}): Promise<AddEmployeeKnowledgeResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );
    const employeeId = input.employeeId.trim();
    const url = input.url.trim();

    if (!employeeId || !url) {
      return { ok: false, message: "Employee and URL are required." };
    }

    const allowed = await assertEmployeeAccess(
      workspace.organization.id,
      employeeId,
    );
    if (!allowed) {
      return { ok: false, message: "Employee not found." };
    }

    const content = await fetchKnowledgeUrlContent(url);
    const created = await createKnowledgeSource({
      employeeId,
      type: "url",
      title: url,
      chunks: [{ content }],
    });

    revalidatePath(`/dashboard/employees/${employeeId}`);
    return { ok: true, sourceId: created.source.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to add knowledge URL.",
    };
  }
}
