"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeCapabilitiesPanel({
  skills,
  tools,
  knowledge,
}: {
  skills: ReactNode;
  tools: ReactNode;
  knowledge: ReactNode;
}) {
  const t = useTranslations("employees.detail");

  return (
    <Tabs defaultValue="skills" className="w-full">
      <TabsList
        variant="line"
        className="mb-4 h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-white/10 bg-transparent p-0"
      >
        <TabsTrigger
          value="skills"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("skills")}
        </TabsTrigger>
        <TabsTrigger
          value="tools"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("tools")}
        </TabsTrigger>
        <TabsTrigger
          value="knowledge"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          {t("knowledge")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="skills" className="mt-0">
        {skills}
      </TabsContent>
      <TabsContent value="tools" className="mt-0">
        {tools}
      </TabsContent>
      <TabsContent value="knowledge" className="mt-0">
        {knowledge}
      </TabsContent>
    </Tabs>
  );
}
