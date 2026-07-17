import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocaleOrDefault } from "@/i18n/resolve-locale-from-geo";
import { applySecurityHeaders } from "@/shared/security/apply-security-headers";
import { buildContentSecurityPolicy } from "@/shared/security/security-header-values";

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

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (isProtectedRoute(pathname) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Per-request nonce: Next.js reads the CSP from the forwarded request
  // headers and stamps the nonce onto every script tag it renders.
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce),
  );

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // First-visit locale from edge geo (country only — never persist IP).
  // Manual LandingLocaleSwap / setLocaleCookie still wins via existing cookie.
  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    const locale = resolveLocaleOrDefault(request.headers);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return applySecurityHeaders(response, nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
