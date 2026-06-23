type ServerLogLevel = "info" | "warn" | "error";

export function logServerEvent(
  event: string,
  data: Record<string, string | number | boolean | undefined> = {},
  level: ServerLogLevel = "info",
): void {
  const payload = JSON.stringify({
    type: "server_event",
    level,
    event,
    ...data,
    at: new Date().toISOString(),
  });

  if (level === "error") {
    process.stderr.write(`${payload}\n`);
    return;
  }

  process.stdout.write(`${payload}\n`);
}
