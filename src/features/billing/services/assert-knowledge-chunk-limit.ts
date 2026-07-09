import { count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import { getKnowledgeChunkLimitForPlan } from "../lib/knowledge-chunk-limit";

export async function countOrganizationKnowledgeChunks(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(knowledgeChunk)
    .innerJoin(knowledgeSource, eq(knowledgeChunk.sourceId, knowledgeSource.id))
    .innerJoin(
      digitalEmployee,
      eq(knowledgeSource.employeeId, digitalEmployee.id),
    )
    .where(eq(digitalEmployee.organizationId, organizationId));

  return Number(row?.total ?? 0);
}

export async function assertCanAddKnowledgeChunks(
  organizationId: string,
  additionalChunks: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (additionalChunks <= 0) {
    return { ok: true };
  }

  const [org] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return { ok: false, message: "Organization not found." };
  }

  const planId = resolveBillingPlanId(org.billingPlan);
  const limit = getKnowledgeChunkLimitForPlan(planId);

  if (limit == null) {
    return { ok: true };
  }

  const current = await countOrganizationKnowledgeChunks(organizationId);
  if (current + additionalChunks > limit) {
    return {
      ok: false,
      message: `Your plan allows ${limit.toLocaleString()} knowledge chunks. Upgrade to add more.`,
    };
  }

  return { ok: true };
}

export async function assertCanAddKnowledgeChunksForEmployee(
  employeeId: string,
  additionalChunks: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const [employee] = await db
    .select({ organizationId: digitalEmployee.organizationId })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    return { ok: false, message: "Employee not found." };
  }

  return assertCanAddKnowledgeChunks(
    employee.organizationId,
    additionalChunks,
  );
}
