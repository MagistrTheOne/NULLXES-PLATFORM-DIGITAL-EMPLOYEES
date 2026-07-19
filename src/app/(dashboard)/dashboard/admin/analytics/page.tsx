import { redirect } from "next/navigation";
import {
  getPlatformAnalyticsSnapshot,
  isPlatformAdminEmail,
  PlatformAnalyticsScreen,
} from "@/features/admin";
import { requireAuth } from "@/features/auth/services/require-auth";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default async function PlatformAnalyticsPage() {
  let session;
  try {
    session = await requireAuth();
  } catch (error: unknown) {
    if (
      isTransientDatabaseError(error) ||
      (error instanceof Error &&
        error.message.includes("database temporarily unreachable"))
    ) {
      throw new Error(
        "Failed to load platform analytics: database temporarily unreachable",
      );
    }
    throw error;
  }

  if (!isPlatformAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  let snapshot;
  try {
    snapshot = await getPlatformAnalyticsSnapshot();
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error(
        "Failed to load platform analytics: database temporarily unreachable",
      );
    }
    throw error;
  }

  return <PlatformAnalyticsScreen snapshot={snapshot} />;
}
