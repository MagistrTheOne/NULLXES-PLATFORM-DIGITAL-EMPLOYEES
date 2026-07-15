import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { resolveTalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { synthesizeTalkVoicePcm } from "@/features/runtime-session/services/synthesize-talk-voice-pcm";
import { ADELINE_KALEN_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";
import { checkRateLimit } from "@/shared/security/rate-limit";

export const runtime = "nodejs";

type Body = {
  employeeId?: string;
  text?: string;
};

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Public ElevenLabs TTS for the Adeline landing Talk demo only.
 * Same voice ID as dashboard Talk (session.voiceId).
 */
export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request);
  const rate = await checkRateLimit({
    name: "landing-adeline-tts",
    key: ip,
    limit: 40,
    windowMs: 60 * 60 * 1000,
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

  if (employeeId !== ADELINE_KALEN_EMPLOYEE_ID) {
    return NextResponse.json({ error: "Demo voice is Adeline-only" }, { status: 403 });
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
    .where(eq(digitalEmployee.id, ADELINE_KALEN_EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    return NextResponse.json(
      { error: "Adeline demo is temporarily unavailable." },
      { status: 503 },
    );
  }

  const context = await getEmployeeTalkContext(
    employee.organizationId,
    employee.id,
  );

  if (!context?.voiceId || resolveTalkVoiceMode(context) !== "elevenlabs") {
    return NextResponse.json(
      { error: "Adeline ElevenLabs voice is not configured." },
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
