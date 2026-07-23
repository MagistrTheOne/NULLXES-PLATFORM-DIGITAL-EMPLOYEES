import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/shared/seo";
import { DocsShell } from "./_components/docs-shell";

export async function generateMetadata() {
  const t = await getTranslations("docs.overviewMeta");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/docs",
  });
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
