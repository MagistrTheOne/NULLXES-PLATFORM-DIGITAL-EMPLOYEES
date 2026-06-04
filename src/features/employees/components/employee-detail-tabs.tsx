"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeDetailTabs({
  children,
}: {
  children: React.ReactNode;
}) {
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
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="avatar"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          Avatar
        </TabsTrigger>
        <TabsTrigger
          value="voice"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          Voice
        </TabsTrigger>
        <TabsTrigger
          value="brain"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          Brain
        </TabsTrigger>
        <TabsTrigger
          value="knowledge"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          Knowledge
        </TabsTrigger>
        <TabsTrigger
          value="lifecycle"
          className="rounded-none border-0 px-3 py-2 text-white/50 data-active:bg-transparent data-active:text-white"
        >
          Lifecycle
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
