import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/shared/security/apply-security-headers";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/employees",
  "/analytics",
  "/settings",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (isProtectedRoute(pathname) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/employees",
    "/employees/:path*",
    "/analytics",
    "/analytics/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/register",
    "/accept-invite",
  ],
};
