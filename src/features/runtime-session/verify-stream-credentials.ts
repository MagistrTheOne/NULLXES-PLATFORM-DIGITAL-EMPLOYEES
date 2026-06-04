import { StreamClient } from "@stream-io/node-sdk";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import {
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";

loadEnvFiles();

async function verifyStreamCredentials(): Promise<void> {
  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();

  if (!apiKey || !secret) {
    throw new Error("STREAM_API_KEY and STREAM_SECRET_KEY must be set in .env");
  }

  const client = new StreamClient(apiKey, secret);
  const callTypes = await client.video.listCallTypes();
  const entries = Object.values(callTypes.call_types ?? {});
  const names = entries.map((type) => type.name).sort();

  console.log("GetStream Video credentials: OK");
  console.log(`API key prefix: ${apiKey.slice(0, 4)}…`);
  console.log(`Call types (${names.length}): ${names.join(", ")}`);

  const development = callTypes.call_types?.development;
  const defaultType = callTypes.call_types?.default;

  if (development) {
    console.log("Recommended for Phase X bootstrap: call type `development`");
  }

  if (defaultType) {
    console.log("Production talk sessions: call type `default`");
  }
}

verifyStreamCredentials().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("GetStream verification failed:", message);
  process.exit(1);
});
