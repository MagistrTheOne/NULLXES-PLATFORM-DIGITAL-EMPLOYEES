import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { hasWorkspaceAccess } from "@/features/workspace";
import { resolveEmployeeDepartment } from "@/features/hq/lib/map-employee-department";
import { listOrganizationEmployees } from "@/features/employees";
import { ConversationsScreen } from "@/features/conversations/components/conversations-screen";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { getTalkAgentPanel } from "@/features/runtime-session/queries/get-talk-agent-panel";
import { getTalkAgentActivity } from "@/features/runtime-session/queries/get-talk-agent-activity";
import { buildTalkAgentDetails } from "@/features/runtime-session/lib/build-talk-agent-details";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const resolved = await searchParams;
  const requestedEmployeeId =
    typeof resolved.employee === "string" ? resolved.employee : undefined;

  const page = await listOrganizationEmployees(workspace.organization.id, {
    limit: 1000,
  });

  const talkReady = page.items.filter((employee) => employee.canTalk);
  const selectedId =
    requestedEmployeeId &&
    talkReady.some((employee) => employee.id === requestedEmployeeId)
      ? requestedEmployeeId
      : (talkReady[0]?.id ?? null);

  if (requestedEmployeeId && !selectedId) {
    redirect("/dashboard/conversations");
  }

  let agentDetails = null;
  let brainModelLabel: string | null = null;
  let departmentLabel: string | null = null;

  if (selectedId) {
    try {
      const employee = await getEmployeeTalkContext(
        workspace.organization.id,
        selectedId,
      );

      if (employee?.canTalk) {
        const [panel, activity, locale, tHq] = await Promise.all([
          getTalkAgentPanel(employee.id),
          getTalkAgentActivity(employee.id),
          getLocale(),
          getTranslations("hq.departments"),
        ]);

        const departmentSlug = resolveEmployeeDepartment(
          employee.department,
          employee.role,
        );
        departmentLabel = tHq(departmentSlug);

        brainModelLabel = formatBrainModelDisplay({
          provider: employee.brainProvider,
          modelId: resolveBrainModelForProvider(
            employee.brainProvider,
            employee.brainModel,
          ),
        });

        agentDetails = buildTalkAgentDetails({
          employee,
          panel,
          locale,
          activity,
          modelLabel: brainModelLabel,
        });
      }
    } catch {
      // Secondary details (panel/activity) failed (e.g. transient DB).
      // Main employees list is still shown; details panel will be empty.
    }
  }

  return (
    <ConversationsScreen
      employees={page.items}
      selectedEmployeeId={selectedId}
      agentDetails={agentDetails}
      brainModelLabel={brainModelLabel}
      viewer={{
        name: workspace.user.name,
        image: workspace.user.image,
        role: workspace.permissions.role,
      }}
      departmentLabel={departmentLabel}
    />
  );
}
