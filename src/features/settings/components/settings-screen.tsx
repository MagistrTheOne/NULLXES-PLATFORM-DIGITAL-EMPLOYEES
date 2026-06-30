"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsPageData } from "../types";
import { SettingsAdvancedTab } from "./SettingsAdvancedTab";
import { SettingsAiTab } from "./SettingsAiTab";
import { SettingsBillingTab } from "./SettingsBillingTab";
import { SettingsContextPanel } from "./SettingsContextPanel";
import { SettingsGeneralTab } from "./SettingsGeneralTab";
import { SettingsIntegrationsTab } from "./SettingsIntegrationsTab";
import { SettingsNotificationsTab } from "./SettingsNotificationsTab";
import { SettingsOrganizationTab } from "./SettingsOrganizationTab";
import { SettingsAuditTab } from "./SettingsAuditTab";
import { SettingsSecurityTab } from "./SettingsSecurityTab";
import { SettingsTeamTab } from "./SettingsTeamTab";

const TAB_IDS = [
  "general",
  "organization",
  "team",
  "billing",
  "integrations",
  "security",
  "audit",
  "ai",
  "notifications",
  "advanced",
] as const;

type SettingsTabId = (typeof TAB_IDS)[number];

function resolveSettingsTab(tab: string | null): SettingsTabId {
  if (tab && TAB_IDS.includes(tab as SettingsTabId)) {
    return tab as SettingsTabId;
  }
  return "general";
}

export function SettingsScreen({ data }: { data: SettingsPageData }) {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() =>
    resolveSettingsTab(searchParams.get("tab")),
  );

  useEffect(() => {
    setActiveTab(resolveSettingsTab(searchParams.get("tab")));
  }, [searchParams]);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SettingsTabId)}
            className="gap-6"
          >
            <TabsList
              variant="line"
              className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto border-b border-border bg-transparent p-0 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
              {TAB_IDS.map((tabId) => (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  className="rounded-none border-0 border-b-2 border-transparent px-3 py-2 data-active:border-foreground data-active:bg-transparent"
                >
                  {t(`tabs.${tabId}`)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="general">
              <SettingsGeneralTab
                organization={data.organization}
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="organization">
              <SettingsOrganizationTab
                organization={data.organization}
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="team">
              <SettingsTeamTab
                members={data.context.teamMembers}
                pendingInvites={data.pendingInvites}
                canManageMembers={data.canManageMembers}
                currentUserId={data.currentUserId}
                actorRole={data.actorRole}
                dateFormat={data.settings.dateFormat}
                emailDeliveryConfigured={data.emailDeliveryConfigured}
              />
            </TabsContent>

            <TabsContent value="billing">
              <SettingsBillingTab
                organization={data.organization}
                usage={data.context.usage}
                canManageOrganization={data.canManageOrganization}
                billing={data.billing}
              />
            </TabsContent>

            <TabsContent value="integrations">
              <SettingsIntegrationsTab
                integrations={data.integrations}
                integrationOAuth={data.integrationOAuth}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="security">
              <SettingsSecurityTab
                security={data.security}
                pendingApprovals={data.pendingApprovals}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="audit">
              <SettingsAuditTab
                initialEvents={data.auditEvents}
                initialTotal={data.auditTotal}
              />
            </TabsContent>

            <TabsContent value="ai">
              <SettingsAiTab
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
                providerReadiness={data.brainProviderReadiness}
                providerKeyStatuses={data.providerKeyStatuses}
              />
            </TabsContent>

            <TabsContent value="notifications">
              <SettingsNotificationsTab
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
                emailDeliveryConfigured={data.emailDeliveryConfigured}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <SettingsAdvancedTab
                settings={data.settings}
                organizationName={data.organization.name}
                canManageOrganization={data.canManageOrganization}
                isPlatformAdmin={data.isPlatformAdmin}
                openSessionCount={data.openSessionCount}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="xl:col-span-4">
          <SettingsContextPanel
            organization={data.organization}
            context={data.context}
            dateFormat={data.settings.dateFormat}
          />
        </aside>
      </div>
    </div>
  );
}
