import { getAnamApiKeyPool } from "@/shared/config/anam-api-pool";
import { loadEnvFiles } from "@/shared/config/load-env-files";

loadEnvFiles();

const ANAM_API_BASE_URL =
  process.env.ANAM_API_BASE_URL?.trim() || "https://api.anam.ai/v1";

type AnamAvatar = {
  id?: string;
  displayName?: string;
  name?: string;
  avatarType?: string;
  type?: string;
  source?: string;
  createdAt?: string;
};

async function listForKey(label: string, slot: string, key: string): Promise<void> {
  console.log(`\n=== ${label} (${slot}) ===`);
  try {
    const response = await fetch(`${ANAM_API_BASE_URL}/avatars?perPage=100`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.log(`  ! list failed ${response.status}: ${detail.slice(0, 200)}`);
      return;
    }

    const payload = (await response.json()) as { data?: AnamAvatar[] };
    const avatars = payload.data ?? [];
    if (avatars.length === 0) {
      console.log("  (no avatars)");
      return;
    }

    for (const avatar of avatars) {
      const kind =
        avatar.avatarType ?? avatar.type ?? avatar.source ?? "?";
      console.log(
        `  • ${avatar.displayName ?? avatar.name ?? "(unnamed)"}  [${kind}]  id=${avatar.id}  created=${avatar.createdAt ?? "?"}`,
      );
    }
  } catch (error) {
    console.log(`  ! error: ${error instanceof Error ? error.message : error}`);
  }
}

async function main(): Promise<void> {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    console.log("No Anam keys configured.");
    return;
  }

  for (const entry of pool) {
    await listForKey(entry.label, entry.slot, entry.key);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
