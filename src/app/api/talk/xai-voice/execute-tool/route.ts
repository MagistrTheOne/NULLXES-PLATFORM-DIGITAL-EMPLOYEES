import { NextResponse } from "next/server";
import { executeAgentTool } from "@/features/agent-tools/services/execute-agent-tool";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";

export const runtime = "nodejs";

type XaiVoiceExecuteToolRequest = {
  employeeId?: string;
  sessionId?: string;
  toolName?: string;
  argumentsJson?: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: XaiVoiceExecuteToolRequest;
  try {
    body = (await request.json()) as XaiVoiceExecuteToolRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const toolName = body.toolName?.trim();
  const argumentsJson =
    typeof body.argumentsJson === "string" ? body.argumentsJson : "{}";

  if (!employeeId || !toolName) {
    return NextResponse.json(
      { error: "employeeId and toolName are required" },
      { status: 400 },
    );
  }

  const authResult = await resolveTalkBrainAuth({
    employeeId,
    sessionId: body.sessionId?.trim() || undefined,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const result = await executeAgentTool({
    toolName,
    argumentsJson,
    context: {
      organizationId: authResult.auth.organizationId,
      employeeId,
      sessionId: body.sessionId?.trim() || undefined,
    },
  });

  return NextResponse.json({
    output: result.content,
    requiresApproval: result.requiresApproval ?? false,
  });
}
