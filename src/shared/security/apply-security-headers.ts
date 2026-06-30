import type { NextResponse } from "next/server";
import { getSecurityHeaderEntries } from "./security-header-values";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of getSecurityHeaderEntries()) {
    response.headers.set(key, value);
  }

  return response;
}
