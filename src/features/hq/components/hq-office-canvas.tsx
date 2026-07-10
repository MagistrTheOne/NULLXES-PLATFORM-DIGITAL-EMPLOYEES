"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useGLTF } from "@react-three/drei";
import { useTranslations } from "next-intl";
import { Loader2, Maximize2, Minus, Plus, Sparkles } from "lucide-react";
import type { OrthographicCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  OFFICE_ROOMS,
  OPS_TABLE_POINT,
  STATUS_COLORS,
  placeEmployeesInRoom,
} from "../lib/office-layout";
import { DEPARTMENT_ORDER } from "../lib/department-layout";
import { buildErrandPath, ATRIUM_HUB, ROOM_DOORS } from "../lib/nav-graph";
import { deriveActivitySignals } from "../lib/derive-employee-activity";
import { resolveAgentOfficeState } from "../lib/agent-office-state";
import {
  behaviorFromPlan,
  planHqBehavior,
} from "../lib/hq-behavior-planner";
import { resolveActivityBadgeLabel } from "../lib/resolve-activity-label";
import { HQ_MODELS, pickCharacterModel } from "./office/office-models";
import {
  configureGltfLoaderNoTextures,
  ensureGltfTexturesAreStubbed,
} from "./office/apply-gltf-materials";

// Ensure the global TextureLoader stub is active before any model component or preload runs.
ensureGltfTexturesAreStubbed();
import type { EmployeeThoughtsMap } from "../services/generate-employee-thoughts";
import type { HqRuntimeStatus, HqState } from "../types";
import type { SceneEmployee, SceneRoom } from "./office/scene-types";

function CanvasFallback() {
  const t = useTranslations("hq.office");
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-2 text-black/45">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">{t("loading")}</span>
    </div>
  );
}

const OfficeScene = dynamic(() => import("./office/office-scene"), {
  ssr: false,
  loading: () => <CanvasFallback />,
});

const LEGEND_ORDER: HqRuntimeStatus[] = ["active", "busy", "idle", "offline"];

export function HqOfficeCanvas({
  state,
  llmThoughts = {},
  thoughtsLoading = false,
  onRefreshThoughts,
}: {
  state: HqState;
  llmThoughts?: EmployeeThoughtsMap;
  thoughtsLoading?: boolean;
  onRefreshThoughts?: () => void;
}) {
  const t = useTranslations("hq");
  const tDepartments = useTranslations("hq.departments");
  const tActivity = useTranslations("hq.activity");
  const tLegend = useTranslations("hq.legend");
  const tLofi = useTranslations("hq.lofi");

  const reactions = tLofi.raw("reactions") as string[];
  const meetingLabel = tLofi("meeting");

  // Preload GLTF models from within a React component context.
  // This avoids calling useGLTF.preload at module initialization time.
  // We pass the no-texture configurator + ensure the global stub is on.
  useEffect(() => {
    ensureGltfTexturesAreStubbed();

    const { characters, props } = HQ_MODELS;
    if (characters.female) {
      useGLTF.preload(characters.female, undefined, undefined, configureGltfLoaderNoTextures);
    }
    if (characters.male) {
      useGLTF.preload(characters.male, undefined, undefined, configureGltfLoaderNoTextures);
    }
    if (props) {
      useGLTF.preload(props, undefined, undefined, configureGltfLoaderNoTextures);
    }
  }, []);

  // Coarse clock reserved for future timed floor events.
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rooms: SceneRoom[] = DEPARTMENT_ORDER.map((department) => ({
    def: OFFICE_ROOMS[department],
    label: tDepartments(department),
  }));

  const statusCounts = useMemo(() => {
    const counts: Record<HqRuntimeStatus, number> = {
      active: 0,
      busy: 0,
      idle: 0,
      offline: 0,
    };
    for (const employee of state.employees) {
      counts[employee.runtimeStatus] += 1;
    }
    return counts;
  }, [state.employees]);

  const employees: SceneEmployee[] = state.departments.flatMap((group) => {
    const room = OFFICE_ROOMS[group.department];
    const positions = placeEmployeesInRoom(room, group.employees.length);
    const interiorHalfW = Math.max(0.4, room.w / 2 - 0.8);
    const interiorHalfD = Math.max(0.4, room.d / 2 - 0.8);
    const roam = {
      minX: room.x - interiorHalfW,
      maxX: room.x + interiorHalfW,
      minZ: room.z - interiorHalfD,
      maxZ: room.z + interiorHalfD,
    };
    return group.employees.map((employee, index) => {
      const taskLabel = resolveActivityBadgeLabel(
        employee.activity.badge,
        tActivity,
      );
      const signals = deriveActivitySignals({
        status: employee.status,
        isLive: employee.isLive,
        activity: employee.activity,
        task: employee.task,
      });
      const officeState = resolveAgentOfficeState({
        employee,
        signals,
        seatIndex: index,
        seatCount: group.employees.length,
        missionHint: employee.mission,
        taskBadgeLabel: taskLabel,
      });
      const plan = planHqBehavior({
        employee,
        signals,
        taskBadgeLabel: officeState.label ?? taskLabel,
        hasStandup: false,
      });
      // Override plan when office state requires ops-table review walk.
      const effectivePlan =
        officeState.action === "review" && officeState.zone === "ops_table"
          ? {
              ...plan,
              intent: "move" as const,
              anchor: "path" as const,
              animation: "walk" as const,
              movement: "walk_path" as const,
              speechText: officeState.label ?? plan.speechText,
            }
          : officeState.status === "idle"
            ? {
                ...plan,
                intent: "idle" as const,
                anchor: "desk" as const,
                animation: "sit" as const,
                movement: "none" as const,
                speechText: officeState.label ?? null,
              }
            : {
                ...plan,
                speechText: officeState.label ?? plan.speechText,
              };
      const behavior = behaviorFromPlan(effectivePlan, employee.runtimeStatus);
      const speechText = officeState.label ?? effectivePlan.speechText ?? null;

      let task: SceneEmployee["task"] = null;
      if (employee.task) {
        const target: [number, number] = [
          OFFICE_ROOMS[employee.task.destination].x,
          OFFICE_ROOMS[employee.task.destination].z,
        ];
        task = {
          label: employee.task.label,
          target,
          path: buildErrandPath(
            employee.department,
            employee.task.destination,
            target,
          ),
        };
      } else if (officeState.zone === "ops_table") {
        task = {
          label: officeState.label ?? "Review",
          target: OPS_TABLE_POINT,
          path: [
            ROOM_DOORS[employee.department],
            ATRIUM_HUB,
            OPS_TABLE_POINT,
          ],
        };
      }

      return {
        id: employee.id,
        name: employee.name,
        taskLabel: speechText,
        status: employee.runtimeStatus,
        position: positions[index] ?? [room.x, room.z],
        roam,
        behavior,
        plan: effectivePlan,
        officeState,
        speechText,
        thoughts:
          llmThoughts[employee.id] && llmThoughts[employee.id].length > 0
            ? llmThoughts[employee.id]
            : [],
        reactions,
        meetingTarget: null,
        meetingLabel,
        modelUrl: pickCharacterModel(employee.name),
        task,
        deskHighlight:
          officeState.status === "working" && officeState.action !== "handoff",
        audioPulse: officeState.status === "talking",
        blocked: officeState.status === "blocked",
      };
    });
  });

  const zoomBy = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }
    const camera = controls.object as OrthographicCamera;
    camera.zoom = Math.min(110, Math.max(24, camera.zoom * factor));
    camera.updateProjectionMatrix();
    controls.update();
  };

  const toggleFullscreen = () => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative isolate z-0 h-[clamp(420px,58vh,680px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#d2d5d9]"
    >
      {state.employees.length > 0 ? (
        <OfficeScene
          rooms={rooms}
          employees={employees}
          controlsRef={controlsRef}
          opsItems={state.opsItems}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-black/45">{t("office.empty")}</p>
        </div>
      )}

      {/* Zoom + fullscreen controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fullscreen"
        >
          <Maximize2 className="size-3.5" />
        </button>
        {onRefreshThoughts ? (
          <button
            type="button"
            onClick={onRefreshThoughts}
            disabled={thoughtsLoading}
            className="flex size-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label={t("office.refreshThoughts")}
            title={t("office.refreshThoughts")}
          >
            {thoughtsLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>

      {/* Compact live status indicator — top right */}
      <div className="absolute top-4 right-4 flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-[10px] tracking-wide text-white/70 uppercase">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white/80" />
          </span>
          {t("live")} {state.liveCount}
        </span>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        {LEGEND_ORDER.map((status) => (
          <span
            key={status}
            className="flex items-center gap-1 text-[10px] text-white/45"
            title={`${tLegend(status)}: ${statusCounts[status]}`}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="tabular-nums text-white/55">
              {statusCounts[status]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
