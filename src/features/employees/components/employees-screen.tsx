"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { Button } from "@/components/ui/button";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import { loadMoreEmployeesAction } from "@/features/employees/actions/load-more-employees";
import { CreateEmployeeDialog } from "@/features/employees/create";
import type { EmployeeListItem } from "../types";
import { EmployeeEmptyState } from "./employee-empty-state";
import { EmployeeGrid } from "./employee-grid";
import { EmployeeMetrics } from "./employee-metrics";
import { EmployeeToolbar } from "./employee-toolbar";
import {
  EmployeeMaterializationOverlay,
  type EmployeeMaterializationTarget,
} from "./employee-materialization-overlay";

async function retainPortraitPreviewUrl(url: string): Promise<string> {
  if (!url.startsWith("blob:")) {
    return url;
  }

  const response = await fetch(url);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function matchesSearch(employee: EmployeeListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    employee.name.toLowerCase().includes(normalized) ||
    employee.role.toLowerCase().includes(normalized)
  );
}

export function EmployeesScreen({
  employees,
  nextCursor,
}: {
  employees: EmployeeListItem[];
  nextCursor?: string | null;
}) {
  const router = useRouter();
  const permissions = useWorkspacePermissions();
  const t = useTranslations("employees.list");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EmployeeStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedEmployees, setLoadedEmployees] = useState(employees);
  const [loadedNextCursor, setLoadedNextCursor] = useState(nextCursor ?? null);
  const [materialization, setMaterialization] =
    useState<EmployeeMaterializationTarget | null>(null);
  const materializationPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (materializationPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(materializationPreviewRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setLoadedEmployees(employees);
    setLoadedNextCursor(nextCursor ?? null);
  }, [employees, nextCursor]);

  const filteredEmployees = useMemo(() => {
    return loadedEmployees.filter((employee) => {
      const statusMatches =
        statusFilter === "all" || employee.status === statusFilter;
      return statusMatches && matchesSearch(employee, searchQuery);
    });
  }, [loadedEmployees, searchQuery, statusFilter]);

  const hasEmployees = loadedEmployees.length > 0;

  async function handleCreateComplete({
    employeeId,
    name,
    role,
    portraitPreviewUrl,
  }: {
    employeeId: string;
    avatarProvisionStarted: boolean;
    name: string;
    role: string;
    portraitPreviewUrl: string;
  }): Promise<void> {
    const retainedPortrait = await retainPortraitPreviewUrl(portraitPreviewUrl);

    if (materializationPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(materializationPreviewRef.current);
    }

    materializationPreviewRef.current = retainedPortrait.startsWith("blob:")
      ? retainedPortrait
      : null;

    setMaterialization({
      employeeId,
      name,
      role,
      portraitPreviewUrl: retainedPortrait,
    });

    router.refresh();

    const refreshDelaysMs = [8000, 30000, 90000];
    for (const delayMs of refreshDelaysMs) {
      window.setTimeout(() => {
        void revalidateEmployeePaths(employeeId).then(() => router.refresh());
      }, delayMs);
    }
  }

  function dismissMaterialization(): void {
    if (materializationPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(materializationPreviewRef.current);
      materializationPreviewRef.current = null;
    }

    setMaterialization(null);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {tCommon("subtitle.workforce")}
          </p>
        </div>

        {hasEmployees ? (
          <>
            <EmployeeMetrics employees={loadedEmployees} />
            <EmployeeToolbar
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onSearchQueryChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
              onCreateClick={() => setCreateDialogOpen(true)}
              canCreate={permissions.canManageEmployees}
            />
            {filteredEmployees.length > 0 ? (
              <>
                <EmployeeGrid employees={filteredEmployees} />
                {loadedNextCursor && !searchQuery && statusFilter === "all" ? (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 bg-transparent text-white hover:bg-white/5"
                      disabled={isLoadingMore}
                      onClick={() => {
                        setIsLoadingMore(true);
                        void loadMoreEmployeesAction(loadedNextCursor)
                          .then((result) => {
                            if ("items" in result) {
                              setLoadedEmployees((current) => [
                                ...current,
                                ...result.items,
                              ]);
                              setLoadedNextCursor(result.nextCursor);
                            }
                          })
                          .finally(() => {
                            setIsLoadingMore(false);
                          });
                      }}
                    >
                      {isLoadingMore ? t("loadingMore") : t("loadMore")}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="py-8 text-center text-sm text-white/50">
                {t("noMatches")}
              </p>
            )}
          </>
        ) : (
          <EmployeeEmptyState
            onCreateClick={() => setCreateDialogOpen(true)}
            canCreate={permissions.canManageEmployees}
          />
        )}
      </div>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={handleCreateComplete}
      />

      {materialization ? (
        <EmployeeMaterializationOverlay
          target={materialization}
          onDismiss={dismissMaterialization}
          onReady={() => {
            void revalidateEmployeePaths(materialization.employeeId).then(() =>
              router.refresh(),
            );
          }}
        />
      ) : null}
    </>
  );
}
