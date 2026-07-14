import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { CapsulesScreen } from "@/features/capsules/components/capsules-screen";
import { hasWorkspaceAccess } from "@/features/workspace";

export default async function CapsulesPage() {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    redirect("/dashboard");
  }

  return <CapsulesScreen />;
}
