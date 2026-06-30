import { loadEnvFiles } from "../src/shared/config/load-env-files";
import { getAnamApiKeyPool } from "../src/shared/config/anam-api-pool";
import { getAnamApiBaseUrl } from "../src/shared/config/provider-env";

loadEnvFiles();

const ONE_SHOT_CAP = 2;

type AnamAvatarRow = {
  id: string;
  displayName?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
};

function isOneShotAvatar(avatar: AnamAvatarRow): boolean {
  const haystack = `${avatar.imageUrl ?? ""} ${avatar.videoUrl ?? ""}`.toLowerCase();
  return haystack.includes("one-shot") || haystack.includes("one_shot");
}

async function listAvatars(apiKey: string): Promise<AnamAvatarRow[]> {
  const response = await fetch(`${getAnamApiBaseUrl()}/avatars?perPage=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    data?: AnamAvatarRow[];
  };

  return payload.data ?? [];
}

async function main(): Promise<void> {
  const pool = getAnamApiKeyPool();
  if (pool.length === 0) {
    console.log("No ANAM_API_KEY* configured in this environment.");
    return;
  }

  console.log(`Checking ${pool.length} Anam key(s). One-shot cap: ${ONE_SHOT_CAP} per account.\n`);

  const freeSlots: string[] = [];

  for (const entry of pool) {
    try {
      const avatars = await listAvatars(entry.key);
      const oneShots = avatars.filter(isOneShotAvatar);
      const used = oneShots.length;
      const free = Math.max(0, ONE_SHOT_CAP - used);
      const status = free > 0 ? "FREE" : "FULL";

      console.log(
        `${entry.slot} (${entry.label}): ${used}/${ONE_SHOT_CAP} one-shot avatars — ${status}`,
      );

      if (oneShots.length > 0) {
        for (const avatar of oneShots) {
          console.log(`    · ${avatar.displayName ?? "(unnamed)"} [${avatar.id}]`);
        }
      }

      if (free > 0) {
        freeSlots.push(entry.slot);
      }
    } catch (error) {
      console.log(
        `${entry.slot} (${entry.label}): ERROR — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log("\n=== Recommendation ===");
  if (freeSlots.length === 0) {
    console.log(
      "All checked keys are at one-shot capacity. Delete unused avatars in Anam dashboard or add/rotate keys.",
    );
  } else {
    console.log(`Use these slots for the next custom avatar: ${freeSlots.join(", ")}`);
    console.log(`Preferred: ${freeSlots[0]} (first with capacity).`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
