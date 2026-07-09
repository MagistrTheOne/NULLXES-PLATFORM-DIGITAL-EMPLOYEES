"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BILLING_PLANS } from "@/features/billing/config/plans";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { cn } from "@/lib/utils";
import {
  isMoreTab,
  resolveNavGroupForTab,
  resolveSettingsTab,
  SETTINGS_MORE_TABS,
  SETTINGS_PRIMARY_GROUPS,
  type SettingsNavGroupId,
  type SettingsTabId,
} from "../lib/settings-nav";
import type { SettingsPageData } from "../types";
import { SettingsAdvancedTab } from "./SettingsAdvancedTab";
import { SettingsAiTab } from "./SettingsAiTab";
import { SettingsBillingTab } from "./SettingsBillingTab";
import { SettingsGeneralTab } from "./SettingsGeneralTab";
import { SettingsIntegrationsTab } from "./SettingsIntegrationsTab";
import { SettingsNotificationsTab } from "./SettingsNotificationsTab";
import { SettingsAuditTab } from "./SettingsAuditTab";
import { SettingsSecurityTab } from "./SettingsSecurityTab";
import { SettingsTeamTab } from "./SettingsTeamTab";

export function SettingsScreen({
  data,
  blueprintTab,
}: {
  data: SettingsPageData;
  blueprintTab?: React.ReactNode;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const require2faAdmin = searchParams.get("require2fa") === "1";
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
    if (require2faAdmin) {
      return "security";
    }
    return resolveSettingsTab(searchParams.get("tab"));
  });

  const activeGroup = resolveNavGroupForTab(activeTab);
  const plan = BILLING_PLANS[resolveBillingPlanId(data.organization.billingPlan)];

  useEffect(() => {
    if (require2faAdmin) {
      if (activeTab !== "security") {
        setActiveTab("security");
      }
      if (searchParams.get("tab") !== "security") {
        router.replace("/settings?tab=security&require2fa=1");
      }
      return;
    }

    setActiveTab(resolveSettingsTab(searchParams.get("tab")));
  }, [searchParams, require2faAdmin, activeTab, router]);

  function navigateToTab(nextTab: SettingsTabId) {
    setActiveTab(nextTab);
    router.push(`/settings?tab=${nextTab}`);
  }

  function navigateToGroup(groupId: SettingsNavGroupId) {
    const group = SETTINGS_PRIMARY_GROUPS.find((item) => item.id === groupId);
    if (!group) return;

    if (groupId === "more") {
      navigateToTab(
        isMoreTab(activeTab) ? activeTab : group.defaultTab,
      );
      return;
    }

    navigateToTab(group.defaultTab);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm text-foreground">
            {data.organization.name}
          </span>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {plan.name}
          </Badge>
        </div>
      </header>

      <div className="min-w-0">
          <nav
            aria-label={t("nav.primary")}
            className="mb-4 flex flex-wrap gap-1 border-b border-border pb-px"
          >
            {SETTINGS_PRIMARY_GROUPS.map((group) => {
              const isActive = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => navigateToGroup(group.id)}
                  className={cn(
                    "rounded-none border-b-2 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`nav.${group.id}`)}
                </button>
              );
            })}
          </nav>

          {activeGroup === "more" ? (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {SETTINGS_MORE_TABS.map((tabId) => {
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => navigateToTab(tabId)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      isActive
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border bg-background/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    {t(`tabs.${tabId}`)}
                  </button>
                );
              })}
            </div>
          ) : null}

          <Tabs
            value={activeTab}
            onValueChange={(value) => navigateToTab(value as SettingsTabId)}
            className="gap-6"
          >
            {/* Hidden list keeps Tabs a11y; visible nav is the primary groups above. */}
            <TabsList className="sr-only">
              {(
                [
                  "general",
                  "organization",
                  "team",
                  "billing",
                  "integrations",
                  "security",
                  "audit",
                  "ai",
                  "characters",
                  "skills",
                  "tools",
                  "notifications",
                  "advanced",
                ] as const
              ).map((tabId) => (
                <TabsTrigger key={tabId} value={tabId}>
                  {tabId}
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
              <SettingsGeneralTab
                organization={data.organization}
                settings={data.settings}
                canManageOrganization={data.canManageOrganization}
                sections={["profile"]}
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
                require2faAdmin={require2faAdmin}
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

            <TabsContent value="characters">
              {activeTab === "characters" ? blueprintTab : null}
            </TabsContent>
            <TabsContent value="skills">
              {activeTab === "skills" ? blueprintTab : null}
            </TabsContent>
            <TabsContent value="tools">
              {activeTab === "tools" ? blueprintTab : null}
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
    </div>
  );
}
