import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  FOUNDING_PARTNERS_PATH,
  isFoundingPartnerOrganization,
} from "@/features/founding-partners/access";
import { FoundingPartnersGate } from "@/features/founding-partners/founding-partners-gate";

/**
 * Closed Founding Partners program.
 * Reachable by invite / direct link / whitelist only — not linked from billing.
 */
export default async function FoundingPartnersPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(FOUNDING_PARTNERS_PATH)}`);
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const member = isFoundingPartnerOrganization(workspace.organization.id);

  return <FoundingPartnersGate member={member} />;
}
