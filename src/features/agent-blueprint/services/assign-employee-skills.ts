import { and, eq } from "drizzle-orm";
import { employeeSkill } from "@/entities/employee-skill/schema";
import type { SkillProficiency } from "@/entities/skill/types";
import { skill } from "@/entities/skill/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export type EmployeeSkillAssignment = {
  skillId: string;
  proficiency?: SkillProficiency;
  priority?: number;
  isActive?: boolean;
};

export async function assignEmployeeSkills(input: {
  organizationId: string;
  employeeId: string;
  assignments: EmployeeSkillAssignment[];
}): Promise<void> {
  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, input.employeeId),
        eq(digitalEmployee.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new Error("Employee not found");
  }

  for (const [index, assignment] of input.assignments.entries()) {
    const [skillRow] = await db
      .select({ id: skill.id })
      .from(skill)
      .where(
        and(
          eq(skill.id, assignment.skillId),
          orgOrSystemScope(input.organizationId, skill.organizationId),
        ),
      )
      .limit(1);

    if (!skillRow) {
      continue;
    }

    const [existing] = await db
      .select({ id: employeeSkill.id })
      .from(employeeSkill)
      .where(
        and(
          eq(employeeSkill.employeeId, input.employeeId),
          eq(employeeSkill.skillId, assignment.skillId),
        ),
      )
      .limit(1);

    const values = {
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      skillId: assignment.skillId,
      proficiency: assignment.proficiency ?? "standard",
      priority: assignment.priority ?? index,
      isActive: assignment.isActive ?? true,
    };

    if (existing) {
      await db.update(employeeSkill).set({ ...values, updatedAt: new Date() }).where(eq(employeeSkill.id, existing.id));
    } else {
      await db.insert(employeeSkill).values(values);
    }
  }
}

export async function removeEmployeeSkill(input: {
  organizationId: string;
  employeeId: string;
  skillId: string;
}): Promise<void> {
  await db
    .delete(employeeSkill)
    .where(
      and(
        eq(employeeSkill.organizationId, input.organizationId),
        eq(employeeSkill.employeeId, input.employeeId),
        eq(employeeSkill.skillId, input.skillId),
      ),
    );
}

export async function listEmployeeSkillAssignments(input: {
  organizationId: string;
  employeeId: string;
}) {
  return db
    .select({
      assignment: employeeSkill,
      skill,
    })
    .from(employeeSkill)
    .innerJoin(skill, eq(employeeSkill.skillId, skill.id))
    .where(
      and(
        eq(employeeSkill.organizationId, input.organizationId),
        eq(employeeSkill.employeeId, input.employeeId),
      ),
    );
}
