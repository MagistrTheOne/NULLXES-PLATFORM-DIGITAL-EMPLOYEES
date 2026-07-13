import { createHmac, timingSafeEqual } from "node:crypto";
import { getBetterAuthSecret } from "@/shared/config/env";

const DEMO_TOKEN_TTL_SEC = 90;
const DEMO_HEADER = "x-nullxes-demo-token";

export { DEMO_HEADER as LANDING_DEMO_TOKEN_HEADER };

type DemoPayload = {
  v: 1;
  sub: "landing-adeline";
  exp: number;
};

function encode(part: object | string): string {
  const raw = typeof part === "string" ? part : JSON.stringify(part);
  return Buffer.from(raw, "utf8").toString("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", getBetterAuthSecret())
    .update(body)
    .digest("base64url");
}

export function mintLandingDemoToken(): string {
  const payload: DemoPayload = {
    v: 1,
    sub: "landing-adeline",
    exp: Math.floor(Date.now() / 1000) + DEMO_TOKEN_TTL_SEC,
  };
  const body = encode(payload);
  return `${body}.${sign(body)}`;
}

export function verifyLandingDemoToken(
  token: string | null | undefined,
): boolean {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return false;
  }

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as DemoPayload;
    if (payload.v !== 1 || payload.sub !== "landing-adeline") {
      return false;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
