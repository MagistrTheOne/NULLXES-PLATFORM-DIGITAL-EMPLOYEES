"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { STATUS_COLORS } from "../../lib/office-layout";
import { useOfficeStore } from "../../store/use-office-store";
import { CharacterModel } from "./character-model";
import type { SceneEmployee } from "./scene-types";

const WALK_SPEED = 1.4;
const tmpDir = new Vector3();
const scaleTarget = new Vector3();

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

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
  const seed = useRef(
    Math.abs(
      employee.id.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7),
    ) % 2147483647,
  );
  const rng = useRef(seededRandom(seed.current));
  const posRef = useRef(new Vector3(employee.position[0], 0, employee.position[1]));
  const goal = useRef(new Vector3(employee.position[0], 0, employee.position[1]));
  const waitUntil = useRef(0);
  const movingRef = useRef(false);
  const idlePhase = useRef(rng.current() * Math.PI * 2);

  // Pick the next destination based on autonomous behavior. Idle/offline
  // employees settle at their seat; active ones roam inside their room.
  const pickNextGoal = (time: number) => {
    if (employee.behavior === "sit") {
      goal.current.set(employee.position[0], 0, employee.position[1]);
      return;
    }
    const { roam } = employee;
    // 35% of the time return to the desk, otherwise wander the room.
    if (rng.current() < 0.35) {
      goal.current.set(employee.position[0], 0, employee.position[1]);
    } else {
      goal.current.set(
        roam.minX + rng.current() * (roam.maxX - roam.minX),
        0,
        roam.minZ + rng.current() * (roam.maxZ - roam.minZ),
      );
    }
    waitUntil.current = time;
  };

  // Reset the goal when behavior or seat changes (reassignment / status flip).
  useEffect(() => {
    goal.current.set(employee.position[0], 0, employee.position[1]);
    waitUntil.current = 0;
    movingRef.current = false;
  }, [employee.behavior, employee.position]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const time = state.clock.elapsedTime;

    tmpDir.copy(goal.current).sub(posRef.current);
    tmpDir.y = 0;
    const dist = tmpDir.length();

    if (dist > 0.08) {
      movingRef.current = true;
      tmpDir.normalize();
      posRef.current.addScaledVector(tmpDir, Math.min(dist, WALK_SPEED * delta));
      const targetYaw = Math.atan2(tmpDir.x, tmpDir.z);
      root.rotation.y += (targetYaw - root.rotation.y) * Math.min(1, delta * 8);
    } else {
      if (movingRef.current) {
        // Just arrived: pause before deciding the next move.
        movingRef.current = false;
        waitUntil.current = time + 1.5 + rng.current() * 3.5;
      }
      if (employee.behavior === "roam" && time >= waitUntil.current) {
        pickNextGoal(time);
      }
    }

    root.position.x = posRef.current.x;
    root.position.z = posRef.current.z;

    const moving = movingRef.current;
    const seated = employee.behavior === "sit" && !moving;
    if (bodyRef.current) {
      const seatDrop = seated ? -0.18 : 0;
      const bob = moving
        ? Math.abs(Math.sin(time * 9)) * 0.05
        : Math.sin(time * 1.4 + idlePhase.current) * 0.02;
      bodyRef.current.position.y = seatDrop + bob;
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
        {employee.modelUrl ? (
          <Suspense fallback={null}>
            <CharacterModel url={employee.modelUrl} />
          </Suspense>
        ) : (
          <>
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
              <meshStandardMaterial
                color={bodyColor}
                roughness={0.55}
                metalness={0.1}
              />
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
              <meshStandardMaterial
                color="#dcdcdc"
                roughness={0.4}
                metalness={0.05}
              />
            </mesh>
          </>
        )}
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

      {/* Floating name / task badge (screen-space: stable size under the
          orthographic camera, where distanceFactor scaling breaks) */}
      <Html
        position={[0, 1.45, 0]}
        center
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
