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

  const [thought, setThought] = useState<string | null>(null);

  // Imperative motion state (kept out of React to avoid re-renders).
  const seed = useRef(
    Math.abs(
      employee.id.split("").reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7),
    ) % 2147483647,
  );
  const rng = useRef(seededRandom(seed.current));
  const posRef = useRef(new Vector3(employee.position[0], 0, employee.position[1]));
  const goal = useRef(new Vector3(employee.position[0], 0, employee.position[1]));
  const nextDecisionAt = useRef(1 + rng.current() * 6);
  const thoughtHideAt = useRef(0);
  const movingRef = useRef(false);
  const idlePhase = useRef(rng.current() * Math.PI * 2);

  const deskPoint = (): [number, number] => [
    employee.position[0],
    employee.position[1],
  ];
  const coffeePoint = (): [number, number] => [
    employee.roam.maxX,
    employee.roam.maxZ,
  ];
  const randomPoint = (): [number, number] => [
    employee.roam.minX + rng.current() * (employee.roam.maxX - employee.roam.minX),
    employee.roam.minZ + rng.current() * (employee.roam.maxZ - employee.roam.minZ),
  ];

  const emitThought = (time: number) => {
    const pool = employee.thoughts;
    if (pool.length > 0) {
      setThought(pool[Math.floor(rng.current() * pool.length)] ?? null);
      thoughtHideAt.current = time + 4;
    }
  };

  // Autonomous "lofi" decision loop. Active employees move often; idle ones
  // mostly linger at the desk but occasionally wander, grab a coffee, or just
  // surface a thought. Offline employees stay put and never think.
  const decide = (time: number) => {
    if (employee.behavior === "still") {
      goal.current.set(employee.position[0], 0, employee.position[1]);
      return;
    }
    const roll = rng.current();
    const moveBias = employee.behavior === "roam" ? 0.72 : 0.4;
    if (roll < moveBias * 0.6) {
      const [x, z] = randomPoint();
      goal.current.set(x, 0, z);
    } else if (roll < moveBias) {
      const [x, z] = coffeePoint();
      goal.current.set(x, 0, z);
      emitThought(time);
    } else {
      const [x, z] = deskPoint();
      goal.current.set(x, 0, z);
      if (rng.current() < 0.7) {
        emitThought(time);
      }
    }
    const gap = employee.behavior === "roam" ? 3 + rng.current() * 4 : 6 + rng.current() * 7;
    nextDecisionAt.current = time + gap;
  };

  // Reset the goal when behavior or seat changes (reassignment / status flip).
  useEffect(() => {
    goal.current.set(employee.position[0], 0, employee.position[1]);
    movingRef.current = false;
  }, [employee.behavior, employee.position]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const time = state.clock.elapsedTime;

    if (thought !== null && time >= thoughtHideAt.current) {
      setThought(null);
    }

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
      movingRef.current = false;
      if (time >= nextDecisionAt.current) {
        decide(time);
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

      {/* Lofi thought bubble (appears periodically, then fades out) */}
      {thought ? (
        <Html
          position={[0, 1.92, 0]}
          center
          zIndexRange={[30, 0]}
          wrapperClass="pointer-events-none"
        >
          <div className="pointer-events-none flex select-none items-center whitespace-nowrap rounded-2xl border border-black/10 bg-white/90 px-2.5 py-1 text-[10px] font-medium leading-none text-black shadow-sm backdrop-blur-md">
            {thought}
          </div>
        </Html>
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
