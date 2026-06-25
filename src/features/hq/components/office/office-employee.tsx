"use client";

import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { STATUS_COLORS } from "../../lib/office-layout";
import { useOfficeStore } from "../../store/use-office-store";
import type { SceneEmployee } from "./scene-types";

const ATRIUM = new Vector3(0, 0, 0);
const WALK_SPEED = 2.6;
const tmpDir = new Vector3();
const scaleTarget = new Vector3();

export function OfficeEmployee({ employee }: { employee: SceneEmployee }) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const legLeftRef = useRef<Group>(null);
  const legRightRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const selectedId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);

  const isSelected = selectedId === employee.id;
  const color = STATUS_COLORS[employee.status];
  const bodyColor = employee.status === "offline" ? "#2a2a2a" : "#161616";

  // Imperative motion state (kept out of React to avoid re-renders).
  const posRef = useRef(new Vector3(ATRIUM.x, 0, ATRIUM.z));
  const waypoints = useRef<Vector3[]>([]);
  const wpIndex = useRef(0);
  const movingRef = useRef(false);
  const lastTarget = useRef<[number, number]>([Number.NaN, Number.NaN]);
  const idlePhase = useRef(
    Math.abs(employee.position[0] * 12.9898 + employee.position[1] * 78.233) %
      (Math.PI * 2),
  );

  // Build a walk path whenever the destination changes (spawn / reassignment).
  // Routing through the atrium keeps figures from clipping through walls,
  // since every room opens toward the centre.
  useEffect(() => {
    const [tx, tz] = employee.position;
    if (lastTarget.current[0] === tx && lastTarget.current[1] === tz) {
      return;
    }
    lastTarget.current = [tx, tz];

    const target = new Vector3(tx, 0, tz);
    const route: Vector3[] = [];
    if (posRef.current.distanceTo(target) > 0.1) {
      if (posRef.current.distanceTo(ATRIUM) > 1.5) {
        route.push(ATRIUM.clone());
      }
      route.push(target);
    }
    waypoints.current = route;
    wpIndex.current = 0;
    movingRef.current = route.length > 0;
  }, [employee.position]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const time = state.clock.elapsedTime;

    if (movingRef.current && wpIndex.current < waypoints.current.length) {
      const wp = waypoints.current[wpIndex.current];
      tmpDir.copy(wp).sub(posRef.current);
      tmpDir.y = 0;
      const dist = tmpDir.length();
      if (dist < 0.06) {
        wpIndex.current += 1;
        if (wpIndex.current >= waypoints.current.length) {
          movingRef.current = false;
        }
      } else {
        tmpDir.normalize();
        posRef.current.addScaledVector(tmpDir, Math.min(dist, WALK_SPEED * delta));
        const targetYaw = Math.atan2(tmpDir.x, tmpDir.z);
        root.rotation.y += (targetYaw - root.rotation.y) * Math.min(1, delta * 8);
      }
    }

    root.position.x = posRef.current.x;
    root.position.z = posRef.current.z;

    const moving = movingRef.current;
    if (bodyRef.current) {
      bodyRef.current.position.y = moving
        ? Math.abs(Math.sin(time * 9)) * 0.05
        : Math.sin(time * 1.4 + idlePhase.current) * 0.02;
    }
    const swing = moving ? Math.sin(time * 9) * 0.5 : 0;
    if (legLeftRef.current) {
      legLeftRef.current.rotation.x = swing;
    }
    if (legRightRef.current) {
      legRightRef.current.rotation.x = -swing;
    }

    const targetScale = hovered || isSelected ? 1.12 : 1;
    scaleTarget.setScalar(targetScale);
    root.scale.lerp(scaleTarget, 0.18);
  });

  return (
    <group ref={rootRef}>
      <group
        ref={bodyRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onClick={(event) => {
          event.stopPropagation();
          selectEmployee(employee.id);
        }}
      >
        {/* Legs (pivot at hips for walk swing) */}
        <group ref={legLeftRef} position={[-0.07, 0.32, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.26, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} />
          </mesh>
        </group>
        <group ref={legRightRef} position={[0.07, 0.32, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.26, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} />
          </mesh>
        </group>

        {/* Torso */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <capsuleGeometry args={[0.145, 0.32, 6, 14]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} metalness={0.1} />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.19, 0.6, 0]} rotation={[0, 0, 0.2]} castShadow>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.19, 0.6, 0]} rotation={[0, 0, -0.2]} castShadow>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color="#dcdcdc" roughness={0.4} metalness={0.05} />
        </mesh>
      </group>

      {/* Ground status ring (stays on the floor under the figure) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.34, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.34, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.4, 0.46, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ) : null}

      {/* Floating name / task badge */}
      <Html
        position={[0, 1.45, 0]}
        center
        distanceFactor={9}
        zIndexRange={[20, 0]}
        wrapperClass="pointer-events-none"
      >
        <div className="pointer-events-none flex select-none items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/70 px-2.5 py-1 backdrop-blur-md">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] font-medium leading-none text-white">
            {employee.name}
          </span>
          {employee.taskLabel ? (
            <span className="text-[10px] leading-none text-white/45">
              {employee.taskLabel}
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}
