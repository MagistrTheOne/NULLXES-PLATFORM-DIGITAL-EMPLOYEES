import { and, eq, ne } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export type WorkforcePeer = {
  id: string;
  name: string;
  role: string;
  status: string;
};

export async function listWorkforcePeers(input: {
  organizationId: string;
  employeeId: string;
  roleQuery?: string;
}): Promise<WorkforcePeer[]> {
  const rows = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      status: digitalEmployee.status,
    })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, input.organizationId),
        ne(digitalEmployee.id, input.employeeId),
      ),
    )
    .orderBy(digitalEmployee.name);

  const roleQuery = input.roleQuery?.trim().toLowerCase();
  if (!roleQuery) {
    return rows;
  }

  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(roleQuery) ||
      row.role.toLowerCase().includes(roleQuery),
  );
}

export async function resolveWorkforceHandoffTarget(input: {
  organizationId: string;
  fromEmployeeId: string;
  toEmployeeId?: string;
  toEmployeeName?: string;
}): Promise<WorkforcePeer | null> {
  if (input.toEmployeeId) {
    const [row] = await db
      .select({
        id: digitalEmployee.id,
        name: digitalEmployee.name,
        role: digitalEmployee.role,
        status: digitalEmployee.status,
      })
      .from(digitalEmployee)
      .where(
        and(
          eq(digitalEmployee.id, input.toEmployeeId),
          eq(digitalEmployee.organizationId, input.organizationId),
          ne(digitalEmployee.id, input.fromEmployeeId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  const nameQuery = input.toEmployeeName?.trim().toLowerCase();
  if (!nameQuery) {
    return null;
  }

  const peers = await listWorkforcePeers({
    organizationId: input.organizationId,
    employeeId: input.fromEmployeeId,
  });

  const exact = peers.find((peer) => peer.name.toLowerCase() === nameQuery);
  if (exact) {
    return exact;
  }

  const partialMatches = peers.filter(
    (peer) =>
      peer.name.toLowerCase().includes(nameQuery) ||
      peer.role.toLowerCase().includes(nameQuery),
  );

  if (partialMatches.length === 1) {
    return partialMatches[0] ?? null;
  }

  return null;
}
