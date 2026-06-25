"use server";

import { getLocale } from "next-intl/server";
import type { HqTaskDestination } from "@/entities/hq-task";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { parseHqCommand } from "../lib/parse-hq-command";
import { buildHqTaskLabel, createHqTask } from "../services/dispatch-hq-task";

/**
 * Inspect an agent-chat message for a floor command ("go to CRM") and, when it
 * matches, create a running HQ errand so the employee walks there on the floor.
 * Fire-and-forget from the chat pipeline: returns silently on non-commands or
 * any failure, and never blocks the brain reply.
 */
export async function dispatchHqTaskFromChatAction(
  employeeId: string,
  text: string,
): Promise<{ dispatched: boolean; destination?: HqTaskDestination }> {
  const parsed = parseHqCommand(text);
  if (!parsed) {
    return { dispatched: false };
  }

  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );
    const locale = await getLocale();

    await createHqTask({
      organizationId: workspace.organization.id,
      employeeId,
      destination: parsed.destination,
      label: buildHqTaskLabel(parsed.destination, locale),
    });

    return { dispatched: true, destination: parsed.destination };
  } catch {
    return { dispatched: false };
  }
}
