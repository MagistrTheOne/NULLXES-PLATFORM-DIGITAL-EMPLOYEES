"use client";

import { Suspense, useEffect, useRef, useState, Component, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { useControls } from "leva";

// Error boundary to prevent a single failing GLTF (e.g. 404 on prod) from destroying the WebGL context.
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log but don't crash the scene
    if (process.env.NODE_ENV !== "production") {
      console.warn("[HQ] CharacterModel failed to load, falling back to primitive.", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
import {
  FLOOR_HALF,
  STATUS_COLORS,
  getStaticObstacles,
  resolveMovement,
  resolvePlacement,
} from "../../lib/office-layout";
import { MEETING_POINT } from "../../lib/standup";
import { useOfficeStore } from "../../store/use-office-store";
import { Html } from "@react-three/drei";
import { CharacterModel } from "./character-model";
import type { SceneEmployee } from "./scene-types";

const WALK_SPEED = 1.4;
/** Keep soles above the reflector floor so models don't sink. */
const FLOOR_CLEARANCE = 0.05;
const tmpDir = new Vector3();
const scaleTarget = new Vector3();

// Invisible scene boundary: figures (and dragged placements) never leave the
// floor plane. Keep a small inset so they don't clip the outer edge.
const SCENE_BOUND = FLOOR_HALF - 1.5;
function clampToScene(value: number): number {
  return Math.max(-SCENE_BOUND, Math.min(SCENE_BOUND, value));
}

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

export function OfficeEmployee({ employee, allEmployees = [] }: { employee: SceneEmployee; allEmployees?: SceneEmployee[] }) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const legLeftRef = useRef<Group>(null);
  const legRightRef = useRef<Group>(null);
  const armLeftRef = useRef<Group>(null);
  const armRightRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const selectedId = useOfficeStore((state) => state.selectedEmployeeId);
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);
  const beginDrag = useOfficeStore((state) => state.beginDrag);
  const draggingId = useOfficeStore((state) => state.draggingId);
  const dragTarget = useOfficeStore((state) => state.dragTarget);
  const override = useOfficeStore((state) => state.overrides[employee.id]);

  const isDragging = draggingId === employee.id;
  const wasDragging = useRef(false);
  const liftY = useRef(0);

  const isSelected = selectedId === employee.id;
  const color = STATUS_COLORS[employee.status];
  // Slightly lifted dark gray so the fallback figure doesn't disappear into black
  const bodyColor = employee.status === "offline" ? "#2f2f2f" : "#2a2a2a";

  const [thought, setThought] = useState<string | null>(null);
  const [bubbleKind, setBubbleKind] = useState<"thought" | "reaction">("thought");
  const [visionQuote, setVisionQuote] = useState<string | null>(null);

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
  const clockRef = useRef(0);
  const movingRef = useRef(false);
  const pathIndex = useRef(0);
  const pathKeyRef = useRef("");
  const arrivedRef = useRef(false);
  const idlePhase = useRef(rng.current() * Math.PI * 2);

  // Vision "encoder" — simple proximity + facing awareness so agents notice each other.
  const nextVisionCheck = useRef(0);
  const currentQuote = useRef<{ text: string; until: number } | null>(null);

  // Leva panel is hidden in prod (office-scene). Keep defaults in prod builds.
  const HQ_LIVELINESS_DEFAULTS = {
    breatheSpeed: 1.35,
    breatheAmp: 0.022,
    idleLeanAmp: 0,
    lookAmp: 0.18,
  };
  const livelinessControls = useControls(
    "HQ Liveliness",
    {
      breatheSpeed: { value: 1.35, min: 0.1, max: 5, step: 0.05 },
      breatheAmp: { value: 0.022, min: 0, max: 0.1, step: 0.001 },
      idleLeanAmp: { value: 0, min: 0, max: 0.2, step: 0.001 },
      lookAmp: { value: 0.18, min: 0, max: 1, step: 0.01 },
    },
    { collapsed: true },
  );
  const liveliness =
    process.env.NODE_ENV === "development"
      ? livelinessControls
      : HQ_LIVELINESS_DEFAULTS;

  // The "home" desk is the dragged placement when present, else the layout seat.
  const homePoint = (): [number, number] =>
    override ?? [employee.position[0], employee.position[1]];
  const deskPoint = (): [number, number] => homePoint();

  /** Speech bubbles only from LLM thoughts — never status labels or i18n pools. */
  const emitThought = (time: number) => {
    const pool = employee.thoughts;
    if (pool.length === 0) {
      return;
    }
    setBubbleKind("thought");
    setThought(pool[Math.floor(rng.current() * pool.length)] ?? null);
    thoughtHideAt.current = time + 4;
  };

  const emitReaction = () => {
    const pool = employee.thoughts;
    if (pool.length === 0) {
      return;
    }
    setBubbleKind("reaction");
    setThought(pool[Math.floor(rng.current() * pool.length)] ?? null);
    thoughtHideAt.current = clockRef.current + 3.5;
  };

  // Only re-home when seat / override changes — not on every poll tick.
  useEffect(() => {
    if (employee.task) {
      return;
    }
    const [rawX, rawZ] = override ?? [
      employee.position[0],
      employee.position[1],
    ];
    const [hx, hz] = resolvePlacement(
      clampToScene(rawX),
      clampToScene(rawZ),
      getStaticObstacles(),
      0.28,
    );
    goal.current.set(hx, 0, hz);
    posRef.current.x = hx;
    posRef.current.z = hz;
    arrivedRef.current = false;
  }, [employee.position, override, employee.task]);

  // Restart path only when the route signature actually changes.
  useEffect(() => {
    const key = employee.task
      ? employee.task.path.map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join("|")
      : "";
    if (key !== pathKeyRef.current) {
      pathKeyRef.current = key;
      pathIndex.current = 0;
      arrivedRef.current = false;
    }
  }, [employee.task]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const time = state.clock.elapsedTime;
    clockRef.current = time;

    if (thought !== null && time >= thoughtHideAt.current) {
      setThought(null);
    }

    // --- Mouse drag: snap to the pointer position and lift off the floor. ---
    if (isDragging) {
      if (dragTarget) {
        posRef.current.set(
          clampToScene(dragTarget[0]),
          0,
          clampToScene(dragTarget[1]),
        );
      }
      root.position.x = posRef.current.x;
      root.position.z = posRef.current.z;
      liftY.current += (0.45 - liftY.current) * Math.min(1, delta * 12);
      root.position.y = FLOOR_CLEARANCE + liftY.current + Math.sin(time * 6) * 0.03;
      if (!wasDragging.current) {
        wasDragging.current = true;
        emitReaction();
      }
      const dragScale = 1.18;
      scaleTarget.setScalar(dragScale);
      root.scale.lerp(scaleTarget, 0.25);
      return;
    }

    // Just dropped: settle back to the floor and react once.
    if (wasDragging.current) {
      wasDragging.current = false;
      emitReaction();
    }
    liftY.current += (0 - liftY.current) * Math.min(1, delta * 10);
    root.position.y = FLOOR_CLEARANCE + liftY.current;

    // Follow invisible nav path only when platform state requires relocation.
    if (employee.task && employee.task.path.length > 0) {
      const path = employee.task.path;
      if (arrivedRef.current) {
        const last = path[path.length - 1]!;
        goal.current.set(last[0], 0, last[1]);
      } else {
        const idx = Math.min(pathIndex.current, path.length - 1);
        const node = path[idx]!;
        goal.current.set(node[0], 0, node[1]);
        const reach = tmpDir.copy(goal.current).sub(posRef.current);
        reach.y = 0;
        if (reach.length() < 0.28) {
          if (pathIndex.current < path.length - 1) {
            pathIndex.current += 1;
          } else {
            arrivedRef.current = true;
          }
        }
      }
    } else {
      pathIndex.current = 0;
      arrivedRef.current = false;
      if (employee.meetingTarget) {
        goal.current.set(employee.meetingTarget[0], 0, employee.meetingTarget[1]);
      } else {
        const [x, z] = deskPoint();
        goal.current.set(x, 0, z);
      }
    }

    tmpDir.copy(goal.current).sub(posRef.current);
    tmpDir.y = 0;
    const dist = tmpDir.length();

    if (dist <= 0.12) {
      movingRef.current = false;
      posRef.current.x = goal.current.x;
      posRef.current.z = goal.current.z;
    } else {
      movingRef.current = true;
      tmpDir.normalize();
      const step = Math.min(dist, WALK_SPEED * delta);
      const desiredX = posRef.current.x + tmpDir.x * step;
      const desiredZ = posRef.current.z + tmpDir.z * step;
      const obstacles = getStaticObstacles();
      const [resolvedX, resolvedZ] = resolveMovement(
        posRef.current.x,
        posRef.current.z,
        desiredX,
        desiredZ,
        obstacles,
        employee.task && !arrivedRef.current ? 0.2 : 0.24,
      );
      posRef.current.x = resolvedX;
      posRef.current.z = resolvedZ;
      const targetYaw = Math.atan2(tmpDir.x, tmpDir.z);
      root.rotation.y += (targetYaw - root.rotation.y) * Math.min(1, delta * 8);
    }

    if (!movingRef.current) {
      if (employee.meetingTarget) {
        const faceYaw = Math.atan2(
          MEETING_POINT[0] - posRef.current.x,
          MEETING_POINT[1] - posRef.current.z,
        );
        root.rotation.y += (faceYaw - root.rotation.y) * Math.min(1, delta * 6);
      } else if (!employee.task && time >= nextDecisionAt.current) {
        if (employee.thoughts.length > 0) {
          emitThought(time);
          nextDecisionAt.current = time + 10 + rng.current() * 8;
        } else {
          nextDecisionAt.current = time + 16;
        }
      }

      if (
        !employee.meetingTarget &&
        !employee.task &&
        employee.plan.movement === "none" &&
        employee.plan.anchor === "desk"
      ) {
        const idleLook =
          Math.sin(time * 0.35 + idlePhase.current) * liveliness.lookAmp * 0.45;
        const faceDesk = Math.atan2(
          deskPoint()[0] - posRef.current.x + 0.01,
          deskPoint()[1] - posRef.current.z - 0.4,
        );
        root.rotation.y +=
          (faceDesk + idleLook - root.rotation.y) * Math.min(1, delta * 3);
      }
    }

    posRef.current.x = clampToScene(posRef.current.x);
    posRef.current.z = clampToScene(posRef.current.z);

    // Keep feet clear of desks/walls — including settled seats (push-out, not clamp-in).
    {
      const finalObstacles = getStaticObstacles();
      const [finalX, finalZ] = resolvePlacement(
        posRef.current.x,
        posRef.current.z,
        finalObstacles,
        movingRef.current ? 0.24 : 0.28,
      );
      posRef.current.x = finalX;
      posRef.current.z = finalZ;
    }

    root.position.x = posRef.current.x;
    root.position.z = posRef.current.z;

    const moving = movingRef.current;
    const animation = employee.plan.animation;

    // Sit only when typing at desk — otherwise stand upright (iso lean reads as "tilted").
    const shouldSit =
      !moving &&
      employee.plan.anchor === "desk" &&
      animation === "type" &&
      !employee.meetingTarget &&
      !employee.task;

    const sitOffsetY = shouldSit ? -0.08 : 0;
    root.position.y = FLOOR_CLEARANCE + liftY.current + sitOffsetY;

    if (bodyRef.current) {
      // Never apply lateral roll — isometric camera turns pitch into fake left lean.
      bodyRef.current.rotation.z = 0;

      if (moving) {
        bodyRef.current.position.y = Math.abs(Math.sin(time * 9)) * 0.05;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.y = 0;
      } else if (animation === "type") {
        bodyRef.current.position.y = Math.sin(time * 6 + idlePhase.current) * 0.035;
        bodyRef.current.rotation.x = -0.04;
        bodyRef.current.rotation.y = 0;
      } else if (animation === "listen") {
        bodyRef.current.position.y = Math.sin(time * 1.2 + idlePhase.current) * 0.025;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.y =
          Math.sin(time * 0.18 + idlePhase.current) * 0.03;
      } else {
        // Stand / idle — upright, breath only
        const breathe =
          Math.sin(time * liveliness.breatheSpeed + idlePhase.current) *
          liveliness.breatheAmp;
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.y =
          Math.sin(time * 0.18 + idlePhase.current) * 0.02;
      }
    }

    const swing =
      moving || animation === "walk"
        ? Math.sin(time * 9) * 0.5
        : animation === "type"
          ? Math.sin(time * 7) * 0.12
          : 0;

    if (legLeftRef.current) {
      if (shouldSit) {
        // Relaxed seated leg angle (slight asymmetry + micro move)
        legLeftRef.current.rotation.x = 0.95 + Math.sin(time * 0.6 + idlePhase.current) * 0.015;
      } else {
        legLeftRef.current.rotation.x = swing;
      }
    }
    if (legRightRef.current) {
      if (shouldSit) {
        legRightRef.current.rotation.x = 0.88 + Math.sin(time * 0.65 + 1.1) * 0.015;
      } else {
        legRightRef.current.rotation.x = -swing;
      }
    }

    // Occasional stretch / arm raise when sitting idle (живность)
    if (shouldSit && armLeftRef.current && armRightRef.current) {
      const t = time * 0.065;
      const left = Math.max(0, Math.sin(t + idlePhase.current) - 0.62) * 3.5;
      const right = Math.max(0, Math.sin(t * 0.91 + 3.7) - 0.62) * 3.5;

      // left arm
      armLeftRef.current.rotation.z = 0.55 + left * 0.55;
      armLeftRef.current.position.y = 0.58 + left * 0.06;
      armLeftRef.current.position.x = -0.19 - left * 0.02;

      // right arm
      armRightRef.current.rotation.z = -0.55 - right * 0.55;
      armRightRef.current.position.y = 0.58 + right * 0.06;
      armRightRef.current.position.x = 0.19 + right * 0.02;
    } else {
      // reset to relaxed pose
      if (armLeftRef.current) {
        armLeftRef.current.rotation.z = 0.55;
        armLeftRef.current.position.set(-0.19, 0.58, 0.04);
      }
      if (armRightRef.current) {
        armRightRef.current.rotation.z = -0.55;
        armRightRef.current.position.set(0.19, 0.58, 0.04);
      }
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
          document.body.style.cursor = "grab";
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
          if (!isDragging) {
            document.body.style.cursor = "default";
          }
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          selectEmployee(employee.id);
          beginDrag(employee.id);
          document.body.style.cursor = "grabbing";
        }}
      >
        {employee.modelUrl ? (
          <Suspense fallback={null}>
            <ModelErrorBoundary>
              <CharacterModel url={employee.modelUrl} />
            </ModelErrorBoundary>
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

            {/* Arms — support micro stretch when idle */}
            <group ref={armLeftRef} position={[-0.19, 0.58, 0.04]} rotation={[0.1, 0, 0.55]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
                <meshStandardMaterial color={bodyColor} roughness={0.6} />
              </mesh>
            </group>
            <group ref={armRightRef} position={[0.19, 0.58, 0.04]} rotation={[0.1, 0, -0.55]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
                <meshStandardMaterial color={bodyColor} roughness={0.6} />
              </mesh>
            </group>

            {/* Head (fallback when no GLB model) */}
            <mesh position={[0, 0.92, 0]} castShadow>
              <sphereGeometry args={[0.13, 18, 18]} />
              <meshStandardMaterial
                color="#c8b8a8"
                roughness={0.55}
                metalness={0.03}
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
      {employee.deskHighlight ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <circleGeometry args={[0.55, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
        </mesh>
      ) : null}
      {employee.audioPulse ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
          <ringGeometry args={[0.38, 0.42, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ) : null}
      {employee.blocked ? (
        <mesh position={[0.28, 0.08, 0.28]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#f87171" />
        </mesh>
      ) : null}
      {employee.hasLoadout ? (
        <mesh position={[-0.28, 0.08, 0.28]}>
          <boxGeometry args={[0.07, 0.07, 0.07]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      ) : null}
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.4, 0.46, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ) : null}

      {/* Bubble: lofi thought (light) or a grab/drop reaction (dark NULLXES). */}
      {thought ? (
        <Html
          position={[0, 1.92, 0]}
          center
          zIndexRange={[30, 0]}
          wrapperClass="pointer-events-none"
        >
          <div
            className={
              bubbleKind === "reaction"
                ? "pointer-events-none flex max-w-[180px] select-none items-center rounded-2xl border border-white/15 bg-black/85 px-2.5 py-1 text-center text-[10px] font-medium leading-tight text-white shadow-md backdrop-blur-md"
                : "pointer-events-none flex select-none items-center whitespace-nowrap rounded-2xl border border-black/10 bg-white/90 px-2.5 py-1 text-[10px] font-medium leading-none text-black shadow-sm backdrop-blur-md"
            }
          >
            {thought}
          </div>
        </Html>
      ) : null}

      {/* Vision quote — agents notice each other and "say" something (vision encoder simulation) */}
      {visionQuote ? (
        <Html position={[0, 2.15, 0]} center zIndexRange={[40, 0]} wrapperClass="pointer-events-none">
          <div className="pointer-events-none max-w-[210px] select-none rounded-2xl border border-white/10 bg-[#111111]/90 px-3 py-1 text-center text-[10px] leading-snug text-white/90 shadow backdrop-blur">
            {visionQuote}
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
          {employee.task ? (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/90">
              {employee.task.label}
            </span>
          ) : employee.meetingTarget ? (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/90">
              {employee.meetingLabel}
            </span>
          ) : employee.taskLabel ? (
            <span className="text-[10px] leading-none text-white/45">
              {employee.taskLabel}
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}
