import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { LANDING_DEMO_MARKETING_PORTRAIT } from "@/features/landing/lib/adeline-marketing";
import { mintLandingDemoToken } from "@/features/landing/lib/landing-demo-token";
import { loadLandingTalkBrainCache } from "@/features/landing/lib/landing-talk-brain-cache";
import { ensureLandingDemoAnamAvatar } from "@/features/landing/services/ensure-landing-demo-anam-avatar";
import { createAnamTalkSessionTokenForEmployee } from "@/features/runtime-session/services/create-anam-talk-session";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { resolveTalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { LANDING_DEMO_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";

export const runtime = "nodejs";

export const LANDING_ADELINE_TALK_TRIAL_SECONDS = 60;

/**
 * Unauthenticated 60s Anam avatar Talk trial for the landing demo employee (Anna).
 * Uses the same employee + ElevenLabs voice as dashboard Talk.
 * Per-IP trial caps are off.
 */
export async function POST(_request: Request): Promise<Response> {
  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      organizationId: digitalEmployee.organizationId,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, LANDING_DEMO_EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    return NextResponse.json(
      { error: "Talk trial is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    await ensureLandingDemoAnamAvatar({ employeeId: employee.id });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Talk trial avatar is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // Re-read after possible avatar repair so mint uses the live avatarId.
  const talkContext = await getEmployeeTalkContext(
    employee.organizationId,
    employee.id,
  );

  const tokenResult = await createAnamTalkSessionTokenForEmployee(
    employee.organizationId,
    employee.id,
    talkContext,
    null,
    {
      // Free Anam concurrency faster if the tab dies without stopStreaming.
      silenceBeforeSessionEndSeconds: 20,
    },
  );

  if (!tokenResult.ok) {
    return NextResponse.json(
      { error: tokenResult.message },
      { status: tokenResult.code === "PROVIDER_QUOTA" ? 503 : 502 },
    );
  }

  // Warm persona cache while the avatar connects so turn 1 skips a cold DB build.
  void loadLandingTalkBrainCache({
    organizationId: employee.organizationId,
    employeeId: employee.id,
  });

  const voiceMode = talkContext
    ? resolveTalkVoiceMode(talkContext)
    : "anam";

  return NextResponse.json({
    sessionToken: tokenResult.sessionToken,
    demoProxyToken: mintLandingDemoToken(),
    maxDurationSec: LANDING_ADELINE_TALK_TRIAL_SECONDS,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeRole: talkContext?.role ?? null,
    avatarPreviewUrl:
      talkContext?.avatarPreviewUrl?.trim() || LANDING_DEMO_MARKETING_PORTRAIT,
    voiceMode,
  });
}
