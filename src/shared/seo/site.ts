/**
 * Canonical site identity for metadata, sitemap, and JSON-LD.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://www.nullxesdai.online";

export const SITE_NAME = "NULLXES";
export const SITE_TAGLINE = "Digital Workforce Operating System";

export const SITE_TITLE_DEFAULT =
  "NULLXES — Цифровые сотрудники | Digital Employees";

export const SITE_DESCRIPTION =
  "NULLXES — Digital Workforce Operating System. Создавайте, разворачивайте и управляйте цифровыми сотрудниками (Digital Employees) для поддержки, операций и enterprise-сценариев.";

export const SITE_KEYWORDS = [
  "NULLXES",
  "Цифровые сотрудники",
  "Digital Employees",
  "digital workforce",
  "цифровая рабочая сила",
  "enterprise AI",
  "AI employees",
  "digital workers",
  "Talk AI",
  "workforce OS",
] as const;

/** Default social / OG image (absolute path under public/). */
export const SITE_OG_IMAGE = {
  url: "/marketing/adeline-kalen.jpg",
  width: 1200,
  height: 1600,
  alt: "NULLXES Digital Employee — Adeline Kalen",
} as const;

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") {
    return SITE_URL;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
