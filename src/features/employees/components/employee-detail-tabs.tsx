"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <TabsTrigger
          value="overview"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("overview")}
        </TabsTrigger>
        <TabsTrigger
          value="avatar"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("avatar")}
        </TabsTrigger>
        <TabsTrigger
          value="voice"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("voice")}
        </TabsTrigger>
        <TabsTrigger
          value="brain"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("brain")}
        </TabsTrigger>
        <TabsTrigger
          value="knowledge"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("knowledge")}
        </TabsTrigger>
        <TabsTrigger
          value="tasks"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("tasks")}
        </TabsTrigger>
        <TabsTrigger
          value="lifecycle"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("lifecycle")}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
