import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/shared/security/apply-security-headers";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/employees",
  "/analytics",
  "/settings",
];
const AUTH_ROUTES = ["/login", "/register"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (isProtectedRoute(pathname) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAuthRoute(pathname) && sessionCookie) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
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
