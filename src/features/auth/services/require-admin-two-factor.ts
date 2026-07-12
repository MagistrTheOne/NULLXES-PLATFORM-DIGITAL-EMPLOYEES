import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { resolveWorkspace } from "@/features/workspace/services/resolve-workspace";
import { shouldBypassAdminTwoFactorGate } from "../lib/two-factor-gate-bypass";
import { getCurrentSession } from "./get-current-session";

async function loadAdminTwoFactorGate(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  // Temporary auditor bypass — 2FA feature code stays enabled for everyone else.
  if (shouldBypassAdminTwoFactorGate(session.user.email)) {
    return;
  }

  const [userRow] = await db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userRow?.twoFactorEnabled) {
    return;
  }

  const workspace = await resolveWorkspace({
    userId: session.user.id,
  });

  const role = workspace.membership.role;
  if (role !== "owner" && role !== "admin") {
    return;
  }

  const settings = await ensureOrganizationSettings(
    workspace.organization.id,
  );

  if (!settings.requireTwoFactorForAdmins) {
    return;
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return;
  }

  redirect("/settings?tab=security&require2fa=1");
}

export const requireAdminTwoFactor = cache(loadAdminTwoFactorGate);
