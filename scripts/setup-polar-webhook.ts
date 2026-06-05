import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
const ngrokUrl = process.env.NGROK_URL?.trim();

if (!accessToken) {
  console.error("POLAR_ACCESS_TOKEN is required");
  process.exit(1);
}

if (!ngrokUrl) {
  console.error("NGROK_URL is required (run: npm run tunnel:ngrok)");
  process.exit(1);
}

const webhookUrl = `${ngrokUrl.replace(/\/$/, "")}/api/webhook/polar`;
const server =
  process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";

const polar = new Polar({
  accessToken,
  server,
});

const BILLING_EVENTS = [
  "subscription.active",
  "subscription.canceled",
  "customer.created",
  "order.paid",
] as const;

async function listEndpoints(): Promise<
  Array<{ id: string; url: string; secret: string; name?: string | null }>
> {
  const endpoints: Array<{
    id: string;
    url: string;
    secret: string;
    name?: string | null;
  }> = [];

  const iterator = await polar.webhooks.listWebhookEndpoints({});
  for await (const page of iterator) {
    for (const endpoint of page.result.items) {
      endpoints.push({
        id: endpoint.id,
        url: endpoint.url,
        secret: endpoint.secret,
        name: endpoint.name,
      });
    }
  }

  return endpoints;
}

async function main(): Promise<void> {
  console.log(`Polar server: ${server}`);
  console.log(`Webhook URL (paste in Polar Dashboard):\n${webhookUrl}\n`);

  const existing = await listEndpoints();
  const match = existing.find((endpoint) => endpoint.url === webhookUrl);

  if (match) {
    console.log(`Existing endpoint: ${match.name ?? match.id}`);
    console.log("\nAdd to .env:\n");
    console.log(`POLAR_WEBHOOK_SECRET=${match.secret}`);
    return;
  }

  const created = await polar.webhooks.createWebhookEndpoint({
    url: webhookUrl,
    name: "NULLXES Digital Employees (ngrok)",
    format: "raw",
    events: [...BILLING_EVENTS],
  });

  console.log(`Created webhook endpoint: ${created.id}`);
  console.log("\nAdd to .env:\n");
  console.log(`POLAR_WEBHOOK_SECRET=${created.secret}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
