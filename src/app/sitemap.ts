import type { MetadataRoute } from "next";
import { DOCS_NAV_FLAT } from "./docs/_lib/docs-nav";
import { SITE_URL } from "@/shared/seo";

const PUBLIC_PAGES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/plans", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs/offer", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/privacy", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/terms", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/personal-data", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/api", changeFrequency: "weekly", priority: 0.75 },
  { path: "/docs/security", changeFrequency: "monthly", priority: 0.65 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PUBLIC_PAGES) {
    if (seen.has(page.path)) continue;
    seen.add(page.path);
    entries.push({
      url: page.path === "/" ? SITE_URL : `${SITE_URL}${page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  for (const item of DOCS_NAV_FLAT) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    entries.push({
      url: `${SITE_URL}${item.href}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.55,
    });
  }

  return entries;
}
