import type { Metadata } from "next";
import { buildPageMetadata } from "@/shared/seo";
import { findDocsNavItem } from "./docs-nav";

/**
 * Build Metadata for a docs route from the nav label.
 * Use in page.tsx: `export const metadata = docsPageMetadata("/docs/talk")`
 */
export function docsPageMetadata(
  path: string,
  description?: string,
): Metadata {
  const item = findDocsNavItem(path);
  const title = item?.breadcrumb ?? item?.label ?? "Документация";
  return buildPageMetadata({
    title,
    description:
      description ??
      `${title} — документация NULLXES Digital Employees (Digital Workforce Operating System).`,
    path,
  });
}
