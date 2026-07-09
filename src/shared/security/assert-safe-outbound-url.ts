/**
 * Blocks SSRF to localhost / private / link-local / cloud metadata targets.
 * Call before any server-side fetch of user-supplied URLs.
 *
 * Prefer `assertSafeOutboundUrlResolved` at dispatch time — it also resolves
 * DNS and rejects private/reserved A/AAAA records (DNS rebinding).
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function parseIpv4(hostname: string): number[] | null {
  if (!isIpv4(hostname)) {
    return null;
  }
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  return parts;
}

function isPrivateOrReservedIpv4(parts: number[]): boolean {
  const [a, b] = parts;

  // 0.0.0.0/8, 127.0.0.0/8 loopback
  if (a === 0 || a === 127) {
    return true;
  }
  // 10.0.0.0/8
  if (a === 10) {
    return true;
  }
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  // 192.168.0.0/16
  if (a === 192 && b === 168) {
    return true;
  }
  // 169.254.0.0/16 link-local / cloud metadata
  if (a === 169 && b === 254) {
    return true;
  }
  // 100.64.0.0/10 CGNAT
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  return false;
}

function isBlockedIpv6(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (host === "::1" || host === "::") {
    return true;
  }
  // Unique local fc00::/7, link-local fe80::/10
  if (
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb")
  ) {
    return true;
  }
  // IPv4-mapped ::ffff:x.x.x.x
  const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) {
    const parts = parseIpv4(mapped[1]!);
    return parts ? isPrivateOrReservedIpv4(parts) : true;
  }

  return false;
}

function assertAddressNotPrivate(address: string): void {
  const version = isIP(address);
  if (version === 4) {
    const parts = parseIpv4(address);
    if (parts && isPrivateOrReservedIpv4(parts)) {
      throw new Error("URL host resolves to a private address.");
    }
    return;
  }

  if (version === 6 && isBlockedIpv6(address)) {
    throw new Error("URL host resolves to a private address.");
  }
}

export function assertSafeOutboundUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("URL host is not allowed.");
  }

  if (
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("URL host is not allowed.");
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4 && isPrivateOrReservedIpv4(ipv4)) {
    throw new Error("URL host is not allowed.");
  }

  if (hostname.includes(":") && isBlockedIpv6(hostname)) {
    throw new Error("URL host is not allowed.");
  }

  return parsed;
}

/** Hostname checks plus DNS resolution against private/reserved ranges. */
export async function assertSafeOutboundUrlResolved(rawUrl: string): Promise<URL> {
  const parsed = assertSafeOutboundUrl(rawUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (isIP(hostname)) {
    assertAddressNotPrivate(hostname.replace(/^\[|\]$/g, ""));
    return parsed;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("URL host could not be resolved.");
  }

  if (records.length === 0) {
    throw new Error("URL host could not be resolved.");
  }

  for (const record of records) {
    assertAddressNotPrivate(record.address);
  }

  return parsed;
}

export function isSafeOutboundUrl(rawUrl: string): boolean {
  try {
    assertSafeOutboundUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}
