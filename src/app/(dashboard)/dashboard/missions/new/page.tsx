import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { listOrganizationEmployees } from "@/features/employees";
import { CreateMissionForm } from "@/features/missions/components/create-mission-form";
import { listOrganizationSkills } from "@/features/agent-blueprint/queries/list-organization-skills";

export default async function NewMissionPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canOperateEmployees) {
    redirect("/dashboard/missions");
  }

  const [employeesPage, skillLibrary] = await Promise.all([
    listOrganizationEmployees(workspace.organization.id, { limit: 50 }),
    listOrganizationSkills(workspace.organization.id),
  ]);

  if (employeesPage.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <Button
          asChild
          variant="ghost"
          className="w-fit px-0 text-white/60 hover:bg-transparent hover:text-white"
        >
          <Link href="/dashboard/missions">Back to missions</Link>
        </Button>
        <div className="rounded-2xl border border-white/8 bg-[#111111] p-6">
          <p className="text-sm text-white/70">
            Create a digital employee before assigning a mission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <Button
        asChild
        variant="ghost"
        className="w-fit px-0 text-white/60 hover:bg-transparent hover:text-white"
      >
        <Link href="/dashboard/missions">Back to missions</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Assign mission
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Give a digital employee a concrete mission with evidence and approval
          before outbound actions.
        </p>
      </div>
      <CreateMissionForm
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
