import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { resolveTalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { synthesizeTalkVoicePcm } from "@/features/runtime-session/services/synthesize-talk-voice-pcm";
import {
  LANDING_DEMO_RATE,
  LANDING_DEMO_RATE_BUCKET,
} from "@/features/landing/lib/landing-demo-rate-limits";
import { LANDING_DEMO_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { resolvePublicClientIpKey } from "@/shared/security/resolve-trusted-client-ip";

export const runtime = "nodejs";

type Body = {
  employeeId?: string;
  text?: string;
};

/**
 * Public ElevenLabs TTS for the landing Talk demo (Anna) only.
 * Same voice ID as dashboard Talk (session.voiceId).
 */
export async function POST(request: Request): Promise<Response> {
  const ip = resolvePublicClientIpKey(request);
  const rate = await checkRateLimit({
    name: LANDING_DEMO_RATE_BUCKET.ttsIp,
    key: ip,
    ...LANDING_DEMO_RATE.ttsIp,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Demo voice limit reached. Try again later." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const text = body.text?.trim();

  if (employeeId !== LANDING_DEMO_EMPLOYEE_ID) {
    return NextResponse.json({ error: "Demo voice is landing-demo only" }, { status: 403 });
  }

  if (!text || text.length > 2_000) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      organizationId: digitalEmployee.organizationId,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, LANDING_DEMO_EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    return NextResponse.json(
      { error: "Demo is temporarily unavailable." },
      { status: 503 },
    );
  }

  const context = await getEmployeeTalkContext(
    employee.organizationId,
    employee.id,
  );

  if (!context?.voiceId || resolveTalkVoiceMode(context) !== "elevenlabs") {
    return NextResponse.json(
      { error: "Demo ElevenLabs voice is not configured." },
      { status: 503 },
    );
  }

  try {
    const pcm = await synthesizeTalkVoicePcm(context.voiceId, text);
    return NextResponse.json({
      pcmBase64: Buffer.from(pcm).toString("base64"),
      voiceId: context.voiceId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "ElevenLabs synthesis failed",
      },
      { status: 502 },
    );
  }
}
