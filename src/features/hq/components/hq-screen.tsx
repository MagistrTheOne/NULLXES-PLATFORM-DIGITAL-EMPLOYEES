"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHqRealtime } from "../lib/use-hq-realtime";
import { useOfficeStore } from "../store/use-office-store";
import type { HqState } from "../types";
import { HqDesignEditor } from "./hq-design-editor";
import { HqDirectory } from "./hq-directory";
import { HqMetricsStrip } from "./hq-metrics-strip";
import { HqOfficeCanvas } from "./hq-office-canvas";
import { HqProfilePanel } from "./hq-profile-panel";
import { HqStatusBar } from "./hq-status-bar";

export function HqScreen({ state: initialState }: { state: HqState }) {
  const t = useTranslations("hq");
  const state = useHqRealtime(initialState);
  const selectedId = useOfficeStore((store) => store.selectedEmployeeId);
  const selectEmployee = useOfficeStore((store) => store.selectEmployee);

  // Pre-select a sensible default so the profile panel is never empty.
  useEffect(() => {
    if (selectedId && state.employees.some((item) => item.id === selectedId)) {
      return;
    }
    const fallback =
      state.employees.find((item) => item.isLive) ?? state.employees[0];
    selectEmployee(fallback?.id ?? null);
  }, [selectedId, state.employees, selectEmployee]);

  return (
    <div className="flex w-full flex-col gap-5">
      <HqStatusBar liveCount={state.liveCount} />

      <Tabs defaultValue="office" className="w-full gap-5">
        <TabsList>
          <TabsTrigger value="office">{t("tabs.office")}</TabsTrigger>
          <TabsTrigger value="directory">{t("tabs.directory")}</TabsTrigger>
          <TabsTrigger value="design">{t("tabs.design")}</TabsTrigger>
        </TabsList>

        <TabsContent value="office" className="flex flex-col gap-4">
          <HqMetricsStrip metrics={state.departmentMetrics} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <HqOfficeCanvas state={state} />
            <HqProfilePanel employees={state.employees} />
          </div>
        </TabsContent>

        <TabsContent value="directory">
          <HqDirectory departments={state.departments} />
        </TabsContent>

        <TabsContent value="design">
          <HqDesignEditor employees={state.employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
