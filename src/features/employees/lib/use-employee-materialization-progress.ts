"use client";

import { useEffect, useRef, useState } from "react";
import {
  getEmployeeProvisioningSnapshotAction,
  type EmployeeProvisioningSnapshot,
} from "../actions/get-employee-provisioning-snapshot";

export type MaterializationStage =
  | "identity"
  | "voice"
  | "presence"
  | "neural"
  | "online";

const POLL_INTERVAL_MS = 4000;

function resolveStage(
  snapshot: EmployeeProvisioningSnapshot | null,
  progress: number,
): MaterializationStage {
  if (snapshot?.canTalk) {
    return "online";
  }

  if (progress < 22) {
    return "identity";
  }

  if (progress < 42) {
    return "voice";
  }

  if (
    progress < 72 ||
    snapshot?.avatarProvisioningStatus !== "ready"
  ) {
    return "presence";
  }

  return "neural";
}

function computeProgress(
  snapshot: EmployeeProvisioningSnapshot | null,
  elapsedMs: number,
): number {
  if (snapshot?.canTalk) {
    return 100;
  }

  const timeProgress = Math.min(38, (elapsedMs / 150_000) * 38);

  let statusProgress = 8;

  if (snapshot?.avatarProvisioningStatus === "ready") {
    statusProgress += 34;
  } else if (snapshot?.avatarProvisioningStatus === "provisioning") {
    statusProgress += 22;
  } else if (snapshot?.avatarProvisioningStatus === "pending") {
    statusProgress += 10;
  }

  if (snapshot?.sessionProvisioningStatus === "ready") {
    statusProgress += 22;
  } else if (snapshot?.sessionProvisioningStatus === "provisioning") {
    statusProgress += 12;
  }

  if (snapshot?.brainProvisioningStatus === "ready") {
    statusProgress += 22;
  } else if (snapshot?.brainProvisioningStatus === "provisioning") {
    statusProgress += 12;
  }

  return Math.min(96, Math.max(timeProgress, statusProgress));
}

export function useEmployeeMaterializationProgress(employeeId: string | null): {
  progress: number;
  stage: MaterializationStage;
  snapshot: EmployeeProvisioningSnapshot | null;
  portraitUrl: string | null;
} {
  const [snapshot, setSnapshot] =
    useState<EmployeeProvisioningSnapshot | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    const trackedEmployeeId = employeeId;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setSnapshot(null);

    let cancelled = false;

    async function poll(): Promise<void> {
      const next = await getEmployeeProvisioningSnapshotAction(trackedEmployeeId);
      if (!cancelled) {
        setSnapshot(next);
      }
    }

    void poll();

    const pollTimer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    const tickTimer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 500);

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      window.clearInterval(tickTimer);
    };
  }, [employeeId]);

  const progress = computeProgress(snapshot, elapsedMs);
  const stage = resolveStage(snapshot, progress);
  const portraitUrl =
    snapshot?.avatarPreviewUrl ?? null;

  return { progress, stage, snapshot, portraitUrl };
}
