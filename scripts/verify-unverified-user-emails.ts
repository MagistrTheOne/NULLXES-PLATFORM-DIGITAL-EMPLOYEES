import { eq } from "drizzle-orm";
import { user } from "@/entities/user/schema";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const emailArg = process.argv[2]?.trim();

async function main(): Promise<void> {
  const normalizedEmail = emailArg?.toLowerCase();
  const rows = normalizedEmail
    ? await db
        .select({ id: user.id, email: user.email, emailVerified: user.emailVerified })
        .from(user)
        .where(eq(user.email, normalizedEmail))
    : await db
        .select({ id: user.id, email: user.email, emailVerified: user.emailVerified })
        .from(user);

  const targets = rows.filter((row) => !row.emailVerified);

  if (targets.length === 0) {
    console.log(
      normalizedEmail
        ? `No unverified user found for ${normalizedEmail}`
        : "No unverified users found",
    );
    return;
  }

  for (const row of targets) {
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, row.id));
    console.log(`Verified: ${row.email}`);
  }

  console.log(`Updated ${targets.length} user(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
