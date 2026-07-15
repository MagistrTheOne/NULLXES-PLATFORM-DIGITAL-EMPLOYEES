import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/shared/seo";
import { DocsShell } from "./_components/docs-shell";

export const metadata: Metadata = buildPageMetadata({
  title: "Документация",
  description:
    "Документация NULLXES Digital Employees: архитектура, Talk, API, безопасность, тарифы и правовые документы.",
  path: "/docs",
});

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
