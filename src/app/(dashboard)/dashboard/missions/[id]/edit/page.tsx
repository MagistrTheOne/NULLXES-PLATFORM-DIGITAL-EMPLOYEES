import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { listOrganizationEmployees } from "@/features/employees";
import { Button } from "@/components/ui/button";
import { EditMissionForm } from "@/features/missions/components/create-mission-form";
import { getMissionDetail } from "@/features/missions/queries/get-mission-detail";
import { listOrganizationSkills } from "@/features/agent-blueprint/queries/list-organization-skills";

const EDITABLE_STATUSES = new Set(["planned", "failed", "cancelled"]);

export default async function EditMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canOperateEmployees) {
    redirect(`/dashboard/missions/${id}`);
  }

  const [mission, employeesPage, skillLibrary] = await Promise.all([
    getMissionDetail(workspace.organization.id, id),
    listOrganizationEmployees(workspace.organization.id, { limit: 200 }),
    listOrganizationSkills(workspace.organization.id),
  ]);

  if (!mission) {
    notFound();
  }

  if (!EDITABLE_STATUSES.has(mission.status)) {
    redirect(`/dashboard/missions/${id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
      <div>
        <Button
          asChild
          variant="ghost"
          className="mb-4 px-0 text-white/60 hover:bg-transparent hover:text-white"
        >
          <Link href={`/dashboard/missions/${id}`}>Back to mission</Link>
        </Button>
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Edit mission
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Update assignment, goal, skills, and brief before execution.
        </p>
      </div>

      <EditMissionForm
        mission={mission}
        employees={employeesPage.items.map((employee) => ({
          id: employee.id,
          name: employee.name,
          role: employee.role,
        }))}
        skillLibrary={skillLibrary.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          slug: skill.slug,
        }))}
      />
    </div>
  );
}
