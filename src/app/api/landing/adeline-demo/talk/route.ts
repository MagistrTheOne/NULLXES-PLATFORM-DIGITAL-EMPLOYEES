import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { ADELINE_MARKETING_PORTRAIT } from "@/features/landing/lib/adeline-marketing";
import { mintLandingDemoToken } from "@/features/landing/lib/landing-demo-token";
import { createAnamTalkSessionTokenForEmployee } from "@/features/runtime-session/services/create-anam-talk-session";
import { ADELINE_KALEN_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { consumeAnamProxyQuota } from "@/features/runtime-session/lib/anam-proxy-quota";

export const runtime = "nodejs";

export const LANDING_ADELINE_TALK_TRIAL_SECONDS = 60;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Unauthenticated 60s Anam avatar Talk trial for Adeline on the marketing landing.
 * No dashboard session row — token only. Rate-limited by IP.
 */
export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request);
  const rate = await checkRateLimit({
    name: "landing-adeline-talk",
    key: ip,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trial limit reached. Try again later." },
      { status: 429 },
    );
  }

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      organizationId: digitalEmployee.organizationId,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, ADELINE_KALEN_EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    return NextResponse.json(
      { error: "Adeline Talk trial is temporarily unavailable." },
      { status: 503 },
    );
  }

  const tokenResult = await createAnamTalkSessionTokenForEmployee(
    employee.organizationId,
    employee.id,
  );

  if (!tokenResult.ok) {
    return NextResponse.json(
      { error: tokenResult.message },
      { status: tokenResult.code === "PROVIDER_QUOTA" ? 503 : 502 },
    );
  }

  const proxyQuota = await consumeAnamProxyQuota({
    subject: "demo:landing-adeline",
    perMinute: 30,
  });
  if (!proxyQuota.ok) {
    return NextResponse.json(
      { error: "Trial busy. Try again in a minute." },
      { status: 429 },
    );
  }

  return NextResponse.json({
    sessionToken: tokenResult.sessionToken,
    demoProxyToken: mintLandingDemoToken(),
    maxDurationSec: LANDING_ADELINE_TALK_TRIAL_SECONDS,
    employeeId: employee.id,
    employeeName: employee.name,
    avatarPreviewUrl: ADELINE_MARKETING_PORTRAIT,
  });
}
