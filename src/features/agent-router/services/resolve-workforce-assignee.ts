import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { classifyIntent } from "@/features/agent-router";
import { db } from "@/shared/db/client";

export type WorkforceAssignee = {
  employeeId: string;
  name: string;
  role: string;
  status: string;
  score: number;
};

function scoreEmployee(input: {
  role: string;
  name: string;
  status: string;
  suggestedWorkflow: string;
  message: string;
}): number {
  let score = 0;
  const haystack = `${input.role} ${input.name}`.toLowerCase();
  const workflow = input.suggestedWorkflow.toLowerCase();
  const message = input.message.toLowerCase();

  if (input.status === "active") {
    score += 3;
  }

  if (workflow && haystack.includes(workflow)) {
    score += 4;
  }

  for (const token of message.split(/\s+/).filter((part) => part.length > 3)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export async function resolveWorkforceAssignee(input: {
  organizationId: string;
  message: string;
  preferredEmployeeId?: string;
}): Promise<WorkforceAssignee | null> {
  const employees = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      status: digitalEmployee.status,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, input.organizationId));

  if (employees.length === 0) {
    return null;
  }

  if (input.preferredEmployeeId) {
    const preferred = employees.find(
      (employee) => employee.id === input.preferredEmployeeId,
    );
    if (preferred) {
      return {
        employeeId: preferred.id,
        name: preferred.name,
        role: preferred.role,
        status: preferred.status,
        score: 100,
      };
    }
  }

  const intent = await classifyIntent({
    message: input.message,
    employeeRole: "workforce router",
  });

  const ranked = employees
    .map((employee) => ({
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      status: employee.status,
      score: scoreEmployee({
        role: employee.role,
        name: employee.name,
        status: employee.status,
        suggestedWorkflow: intent.suggestedWorkflow,
        message: input.message,
      }),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0] ?? null;
}
