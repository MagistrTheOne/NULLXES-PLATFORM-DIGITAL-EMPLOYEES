"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import { loadMoreEmployeesAction } from "@/features/employees/actions/load-more-employees";
import { CreateEmployeeDialog } from "@/features/employees/create";
import { EmployeeCreateUpgradeDialog } from "./employee-create-upgrade-dialog";
import { useEmployeeCreateEligibility } from "../lib/use-employee-create-eligibility";
import type { EmployeeListItem } from "../types";
import { EmployeeEmptyState } from "./employee-empty-state";
import { EmployeeGrid } from "./employee-grid";
import { EmployeeListView } from "./employee-list-view";
import { EmployeeMetrics } from "./employee-metrics";
import { EmployeePagination } from "./employee-pagination";
import { EmployeeTableView } from "./employee-table-view";
import {
  EmployeeToolbar,
  type EmployeeViewMode,
} from "./employee-toolbar";
import {
  EmployeeMaterializationOverlay,
  type EmployeeMaterializationTarget,
} from "./employee-materialization-overlay";
import { ScenarioPostCreateSheet } from "@/features/scenarios/components/scenario-post-create-sheet";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";

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

const PAGE_SIZE_BY_VIEW: Record<EmployeeViewMode, number> = {
  grid: 4,
  list: 10,
  table: 12,
};

const VIEW_MODE_STORAGE_KEY = "nullxes:employees-view-mode";

function readStoredViewMode(): EmployeeViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list" || stored === "table") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "grid";
}

export function EmployeesScreen({
  employees,
  nextCursor,
  loadouts = {},
}: {
  employees: EmployeeListItem[];
  nextCursor?: string | null;
  loadouts?: Record<string, EmployeeLoadout>;
}) {
  const router = useRouter();
  const permissions = useWorkspacePermissions();
  const t = useTranslations("employees.list");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EmployeeStatus>("all");
  const [viewMode, setViewMode] = useState<EmployeeViewMode>("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedEmployees, setLoadedEmployees] = useState(employees);
  const [loadedNextCursor, setLoadedNextCursor] = useState(nextCursor ?? null);
  const { isAtEmployeeLimit, canCreateEmployee } = useEmployeeCreateEligibility(
    loadedEmployees,
  );
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const [materialization, setMaterialization] =
    useState<EmployeeMaterializationTarget | null>(null);
  const [postCreateScenario, setPostCreateScenario] = useState<{
    employeeId: string;
    name: string;
  } | null>(null);
  const materializationPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

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
    const matched = loadedEmployees.filter((employee) => {
      const statusMatches =
        statusFilter === "all" || employee.status === statusFilter;
      return statusMatches && matchesSearch(employee, searchQuery);
    });

    // Own workforce first, then CEO catalog — one list, no section headers.
    return [...matched].sort((a, b) => {
      const aPlatform = a.source === "platform" ? 1 : 0;
      const bPlatform = b.source === "platform" ? 1 : 0;
      return aPlatform - bPlatform;
    });
  }, [loadedEmployees, searchQuery, statusFilter]);

  const hasEmployees = loadedEmployees.length > 0;
  const pageSize = PAGE_SIZE_BY_VIEW[viewMode];

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, viewMode]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const pageEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleViewModeChange(nextMode: EmployeeViewMode): void {
    setViewMode(nextMode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch {
      // ignore
    }
  }

  function loadMoreFromServer(): void {
    if (!loadedNextCursor || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    void loadMoreEmployeesAction(loadedNextCursor)
      .then((result) => {
        if ("items" in result) {
          setLoadedEmployees((current) => [...current, ...result.items]);
          setLoadedNextCursor(result.nextCursor);
        }
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }

  function handlePageChange(nextPage: number): void {
    setPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const remainingPages = totalPages - nextPage;
    if (
      remainingPages <= 1 &&
      loadedNextCursor &&
      !searchQuery &&
      statusFilter === "all"
    ) {
      loadMoreFromServer();
    }
  }

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

    setPostCreateScenario({ employeeId, name });

    router.refresh();

    const refreshDelaysMs = [8000, 30000, 90000];
    for (const delayMs of refreshDelaysMs) {
      window.setTimeout(() => {
        void revalidateEmployeePaths(employeeId).then(() => router.refresh());
      }, delayMs);
    }
  }

  function handleCreateClick(): void {
    if (!canCreateEmployee || isAtEmployeeLimit) {
      setUpgradeDialogOpen(true);
      return;
    }

    setCreateDialogOpen(true);
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
              viewMode={viewMode}
              onSearchQueryChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
              onViewModeChange={handleViewModeChange}
              onCreateClick={handleCreateClick}
              canCreate={
                permissions.canManageEmployees && canCreateEmployee
              }
            />
            <div ref={listTopRef} className="scroll-mt-4" />
            {filteredEmployees.length > 0 ? (
              <div className="flex flex-col gap-4">
                {viewMode === "grid" ? (
                  <EmployeeGrid employees={pageEmployees} loadouts={loadouts} />
                ) : null}
                {viewMode === "list" ? (
                  <EmployeeListView employees={pageEmployees} />
                ) : null}
                {viewMode === "table" ? (
                  <EmployeeTableView employees={pageEmployees} />
                ) : null}
                <EmployeePagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredEmployees.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  isLoading={isLoadingMore}
                />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-white/50">
                {t("noMatches")}
              </p>
            )}
          </>
        ) : (
          <EmployeeEmptyState
            onCreateClick={handleCreateClick}
            canCreate={
              permissions.canManageEmployees && canCreateEmployee
            }
          />
        )}
      </div>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={handleCreateComplete}
      />

      <EmployeeCreateUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        reason="employee_limit"
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

      {postCreateScenario ? (
        <ScenarioPostCreateSheet
          open
          employeeId={postCreateScenario.employeeId}
          employeeName={postCreateScenario.name}
          onOpenChange={(open) => {
            if (!open) {
              setPostCreateScenario(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
