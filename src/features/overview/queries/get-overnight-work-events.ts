import { and, desc, eq, gte } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeWorkEvent } from "@/entities/work-event/schema";
import { db } from "@/shared/db/client";

const DEFAULT_OVERNIGHT_HOURS = 12;

export type OvernightWorkEventRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  eventType: string;
  title: string;
  summary: string | null;
  createdAt: Date;
};

export async function getOvernightWorkEvents(
  organizationId: string,
  hours = DEFAULT_OVERNIGHT_HOURS,
): Promise<OvernightWorkEventRow[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select({
      id: employeeWorkEvent.id,
      employeeId: employeeWorkEvent.employeeId,
      employeeName: digitalEmployee.name,
      eventType: employeeWorkEvent.eventType,
      title: employeeWorkEvent.title,
      summary: employeeWorkEvent.summary,
      createdAt: employeeWorkEvent.createdAt,
    })
    .from(employeeWorkEvent)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeWorkEvent.employeeId),
    )
    .where(
      and(
        eq(employeeWorkEvent.organizationId, organizationId),
        gte(employeeWorkEvent.createdAt, since),
      ),
    )
    .orderBy(desc(employeeWorkEvent.createdAt))
    .limit(50);
}
