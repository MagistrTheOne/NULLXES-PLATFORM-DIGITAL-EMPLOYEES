import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/shared/seo";
import { findDocsNavItem } from "./docs-nav";

/**
 * Build Metadata for a docs route from the nav label.
 * Use in page.tsx: `export const generateMetadata = () => docsPageMetadata("/docs/talk")`
 */
export async function docsPageMetadata(
  path: string,
  description?: string,
): Promise<Metadata> {
  const tNav = await getTranslations("docs.nav");
  const tMeta = await getTranslations("docs.meta");
  const item = findDocsNavItem(path);
  const title = item
    ? tNav(`items.${item.key}.breadcrumb`)
    : tMeta("fallbackTitle");
  return buildPageMetadata({
    title,
    description: description ?? `${title} ${tMeta("descriptionSuffix")}`,
    path,
  });
}
