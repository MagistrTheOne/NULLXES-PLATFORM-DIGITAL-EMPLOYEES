import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { listOrganizationEmployees } from "@/features/employees";
import { CreateMissionWizard } from "@/features/missions/components/create-mission-wizard";
import { listOrganizationSkills } from "@/features/agent-blueprint/queries/list-organization-skills";

export default async function NewMissionPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const t = await getTranslations("missions.wizard");

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
          <Link href="/dashboard/missions">{t("back")}</Link>
        </Button>
        <div className="rounded-2xl border border-white/8 bg-[#111111] p-6">
          <p className="text-sm text-white/70">{t("needEmployee")}</p>
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
        <Link href="/dashboard/missions">{t("back")}</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-white">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-white/60">{t("pageSubtitle")}</p>
      </div>
      <CreateMissionWizard
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
