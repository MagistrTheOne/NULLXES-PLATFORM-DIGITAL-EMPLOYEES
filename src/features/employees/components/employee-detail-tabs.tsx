"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DETAIL_TABS = [
  "overview",
  "appearance",
  "character",
  "capabilities",
  "work",
] as const;

export function EmployeeDetailTabs({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("employees.detail");

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-white/10 bg-transparent p-0"
      >
        {DETAIL_TABS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
          >
            {t(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
