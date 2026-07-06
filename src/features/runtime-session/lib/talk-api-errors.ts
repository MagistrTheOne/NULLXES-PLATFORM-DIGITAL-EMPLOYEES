import { NextResponse } from "next/server";

export type TalkApiErrorCode =
  | "RATE_LIMIT"
  | "SESSION_LIMIT"
  | "REGION_BLOCKED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_QUOTA";

export function talkApiErrorBody(
  code: TalkApiErrorCode,
  message: string,
): { code: TalkApiErrorCode; error: string } {
  return { code, error: message };
}

export function talkApiJsonResponse(
  code: TalkApiErrorCode,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(talkApiErrorBody(code, message), { status });
}
