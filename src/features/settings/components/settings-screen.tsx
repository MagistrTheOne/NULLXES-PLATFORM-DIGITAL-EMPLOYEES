"use client";

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

export function SettingsScreen({ data }: { data: SettingsPageData }) {
  const t = useTranslations("settings");

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

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Tabs defaultValue="general" className="gap-6">
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start gap-1 border-b border-border bg-transparent p-0"
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
              />
            </TabsContent>

            <TabsContent value="billing">
              <SettingsBillingTab
                organization={data.organization}
                usage={data.context.usage}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="integrations">
              <SettingsIntegrationsTab integrations={data.integrations} />
            </TabsContent>

            <TabsContent value="security">
              <SettingsSecurityTab
                security={data.security}
                pendingApprovals={data.pendingApprovals}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="audit">
              <SettingsAuditTab events={data.auditEvents} />
            </TabsContent>

            <TabsContent value="ai">
              <SettingsAiTab settings={data.settings} />
            </TabsContent>

            <TabsContent value="notifications">
              <SettingsNotificationsTab
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <SettingsAdvancedTab
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
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
