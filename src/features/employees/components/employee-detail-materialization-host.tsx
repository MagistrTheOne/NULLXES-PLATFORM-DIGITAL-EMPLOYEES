"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { EmployeeDetailShell } from "../types";
import {
  EmployeeMaterializationOverlay,
  type EmployeeMaterializationTarget,
} from "./employee-materialization-overlay";

function detailMaterializationStorageKey(employeeId: string): string {
  return `employee-detail-materialization:${employeeId}`;
}

function isProvisioningEmployee(employee: EmployeeDetailShell): boolean {
  if (employee.canTalk) {
    return false;
  }

  return (
    employee.avatarProvisioningStatus !== "failed" &&
    employee.sessionProvisioningStatus !== "failed" &&
    employee.brainProvisioningStatus !== "failed"
  );
}

export function EmployeeDetailMaterializationHost({
  employee,
  children,
}: {
  employee: EmployeeDetailShell;
  children: ReactNode;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<EmployeeMaterializationTarget | null>(
    null,
  );

  useEffect(() => {
    if (!isProvisioningEmployee(employee)) {
      return;
    }

    if (sessionStorage.getItem(detailMaterializationStorageKey(employee.id))) {
      return;
    }

    setTarget({
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      portraitPreviewUrl: employee.avatarPreviewUrl ?? "",
    });
  }, [employee]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(detailMaterializationStorageKey(employee.id), "1");
    setTarget(null);
  }, [employee.id]);

  const handleReady = useCallback(() => {
    sessionStorage.setItem(detailMaterializationStorageKey(employee.id), "1");
    setTarget(null);
    router.refresh();
  }, [employee.id, router]);

  return (
    <>
      {children}
      {target ? (
        <EmployeeMaterializationOverlay
          target={target}
          onDismiss={dismiss}
          onReady={handleReady}
        />
      ) : null}
    </>
  );
}
