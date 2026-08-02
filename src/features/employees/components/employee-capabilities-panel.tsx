"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const triggerClass = cn(
  "flex-none rounded-md px-3 py-1.5 text-xs font-medium text-white/45 after:hidden",
  "data-active:bg-white data-active:text-black data-active:shadow-none",
  "dark:data-active:bg-white dark:data-active:text-black",
);

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
    <Tabs defaultValue="skills" className="w-full gap-0">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
        <div className="border-b border-white/8 p-1">
          <TabsList className="h-auto w-full justify-start gap-0.5 rounded-lg bg-black/40 p-0.5">
            <TabsTrigger value="skills" className={triggerClass}>
              {t("skills")}
            </TabsTrigger>
            <TabsTrigger value="tools" className={triggerClass}>
              {t("tools")}
            </TabsTrigger>
            <TabsTrigger value="knowledge" className={triggerClass}>
              {t("knowledge")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skills" className="mt-0">
          {skills}
        </TabsContent>
        <TabsContent value="tools" className="mt-0">
          {tools}
        </TabsContent>
        <TabsContent value="knowledge" className="mt-0 px-3 py-3">
          {knowledge}
        </TabsContent>
      </div>
    </Tabs>
  );
}
