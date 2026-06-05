import { getInngestServeUrl } from "../src/shared/config/env";

async function syncInngest(): Promise<void> {
  const serveUrl = getInngestServeUrl();
  console.log(`Syncing Inngest app at ${serveUrl}`);

  const response = await fetch(serveUrl, {
    method: "PUT",
    headers: {
      "ngrok-skip-browser-warning": "1",
    },
  });
  const body = await response.text();

  if (!response.ok) {
    console.error(`Sync failed (${response.status}): ${body}`);
    process.exit(1);
  }

  console.log(`Sync OK (${response.status})`);
  if (body) {
    console.log(body);
  }
}

void syncInngest();
