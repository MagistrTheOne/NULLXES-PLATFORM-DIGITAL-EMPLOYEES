"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Loader2, Maximize2, Minus, Plus } from "lucide-react";
import type { OrthographicCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  OFFICE_ROOMS,
  STATUS_COLORS,
  placeEmployeesInRoom,
} from "../lib/office-layout";
import { DEPARTMENT_ORDER } from "../lib/department-layout";
import { resolveActivityBadgeLabel } from "../lib/resolve-activity-label";
import type { HqRuntimeStatus, HqState } from "../types";
import type { SceneEmployee, SceneRoom } from "./office/scene-types";

function CanvasFallback() {
  const t = useTranslations("hq.office");
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-2 text-white/40">
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

export function HqOfficeCanvas({ state }: { state: HqState }) {
  const t = useTranslations("hq");
  const tDepartments = useTranslations("hq.departments");
  const tActivity = useTranslations("hq.activity");
  const tLegend = useTranslations("hq.legend");
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rooms: SceneRoom[] = DEPARTMENT_ORDER.map((department) => ({
    def: OFFICE_ROOMS[department],
    label: tDepartments(department),
  }));

  const employees: SceneEmployee[] = state.departments.flatMap((group) => {
    const room = OFFICE_ROOMS[group.department];
    const positions = placeEmployeesInRoom(room, group.employees.length);
    return group.employees.map((employee, index) => {
      const taskLabel = resolveActivityBadgeLabel(
        employee.activity.badge,
        tActivity,
      );
      return {
        id: employee.id,
        name: employee.name,
        taskLabel,
        status: employee.runtimeStatus,
        position: positions[index] ?? [room.x, room.z],
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
      className="relative h-[clamp(420px,58vh,680px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#050505]"
    >
      {state.employees.length > 0 ? (
        <OfficeScene
          rooms={rooms}
          employees={employees}
          controlsRef={controlsRef}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-white/40">{t("office.empty")}</p>
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
      </div>

      {/* Status legend */}
      <div className="absolute right-4 bottom-4 flex items-center gap-4 rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md">
        {LEGEND_ORDER.map((status) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-[11px] text-white/55"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            {tLegend(status)}
          </span>
        ))}
      </div>
    </div>
  );
}
