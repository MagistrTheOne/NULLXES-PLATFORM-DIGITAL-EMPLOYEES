import { notFound, redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import {
  getMissionDetail,
  MissionDetailScreen,
} from "@/features/missions";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  const mission = await getMissionDetail(workspace.organization.id, id);

  if (!mission) {
    notFound();
  }

  return <MissionDetailScreen mission={mission} />;
}
