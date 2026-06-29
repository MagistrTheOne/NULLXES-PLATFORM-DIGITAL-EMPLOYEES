import { redirect } from "next/navigation";
import {
  AnamAdminScreen,
  getAnamPoolStatus,
  isPlatformAdminEmail,
} from "@/features/admin";
import { requireAuth } from "@/features/auth/services/require-auth";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default async function AnamAdminPage() {
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
        "Failed to load Anam admin: database temporarily unreachable",
      );
    }
    throw error;
  }

  if (!isPlatformAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  let status;
  try {
    status = await getAnamPoolStatus();
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error(
        "Failed to load Anam admin: database temporarily unreachable",
      );
    }
    throw error;
  }

  return <AnamAdminScreen status={status} />;
}
