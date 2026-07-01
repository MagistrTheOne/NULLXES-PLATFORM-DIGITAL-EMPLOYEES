import type { NextResponse } from "next/server";
import { getSecurityHeaderEntries } from "./security-header-values";

export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  for (const { key, value } of getSecurityHeaderEntries(nonce)) {
    response.headers.set(key, value);
  }

  return response;
}
