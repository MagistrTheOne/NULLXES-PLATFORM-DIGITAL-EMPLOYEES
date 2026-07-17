"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group as ThreeGroup, Mesh } from "three";
import { useControls } from "leva";
import {
  WALL_HEIGHT,
  WALL_THICKNESS,
  getDeskSlots,
  type RoomDef,
} from "../../lib/office-layout";
import type { SceneRoom } from "./scene-types";

const DESK_COLOR = "#141414";
const CHAIR_COLOR = "#1f1f1f";

type WallVariant = "concrete" | "accent" | "glass";

/**
 * Architectural wall with three material languages:
 *  concrete — white/gray architectural concrete (default, most zones)
 *  accent   — black panels for executive / critical zones
 *  glass    — lightly tinted glass for open-space dividers
 */
function Wall({
  position,
  args,
  variant = "concrete",
}: {
  position: [number, number, number];
  args: [number, number, number];
  variant?: WallVariant;
}) {
  if (variant === "glass") {
    return (
      <group position={position}>
        {/* Tinted glass pane */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial
            color="#1a1d20"
            roughness={0.12}
            metalness={0.4}
            transparent
            opacity={0.34}
          />
        </mesh>
        {/* Thin frame top edge for definition */}
        <mesh position={[0, args[1] / 2 - 0.02, 0]}>
          <boxGeometry args={[args[0], 0.04, args[2] + 0.01]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  if (variant === "accent") {
    return (
      <group position={position}>
        {/* Black accent panel */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color="#0b0b0c" roughness={0.5} metalness={0.18} />
        </mesh>
        {/* Subtle recessed light reveal near the top (premium exec feel) */}
        <mesh position={[0, args[1] / 2 - 0.12, 0]}>
          <boxGeometry args={[args[0] * 0.96, 0.015, args[2] + 0.01]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  }

  // concrete (default)
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#dadcdd" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function Desk({ position, seed = 0 }: { position: [number, number]; seed?: number }) {
  const [x, z] = position;

  // Deterministic variation per desk (0..1 values)
  const r = (n: number) => ((seed * 17 + n * 31) % 1000) / 1000;

  const hasCup = r(1) > 0.25;
  const hasPapers = r(2) > 0.2;
  const hasKeyboard = r(3) > 0.35;
  const hasTinyPlant = r(4) > 0.55;

  return (
    <group position={[x, 0, z]}>
      {/* Desktop surface */}
      <RoundedBox
        args={[1.15, 0.06, 0.68]}
        radius={0.04}
        smoothness={3}
        position={[0, 0.26, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={DESK_COLOR} roughness={0.45} metalness={0.15} />
      </RoundedBox>

      {/* Legs */}
      <mesh position={[-0.42, 0.13, -0.22]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.06]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </mesh>
      <mesh position={[0.42, 0.13, -0.22]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.06]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </mesh>
      <mesh position={[-0.42, 0.13, 0.22]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.06]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </mesh>
      <mesh position={[0.42, 0.13, 0.22]} castShadow>
        <boxGeometry args={[0.06, 0.26, 0.06]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.8} />
      </mesh>

      {/* Animated Monitor (gentle breathing for liveliness) */}
      <Monitor position={[0, 0.52, -0.14]} seed={seed} />

      {/* Monitor stand */}
      <mesh position={[0, 0.32, -0.08]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.08]} />
        <meshStandardMaterial color="#111111" roughness={0.6} />
      </mesh>

      {/* === Desk Clutter (живность) === */}

      {/* Coffee cup */}
      {hasCup && (
        <group position={[-0.28 + r(5) * 0.12, 0.33, 0.12 - r(6) * 0.18]}>
          {/* Cup body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.048, 0.09, 12]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Coffee inside */}
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.01, 12]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.07, 0.01, 0]} rotation={[0, 0, 1.2]}>
            <torusGeometry args={[0.028, 0.012, 6, 10, 2.8]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Stack of papers / notebook */}
      {hasPapers && (
        <group position={[0.22 + r(7) * 0.08, 0.33, -0.08 + r(8) * 0.1]} rotation={[0, r(9) * 0.6 - 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.008, 0.24]} />
            <meshStandardMaterial color="#d8d8d8" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.01, 0]} castShadow>
            <boxGeometry args={[0.17, 0.006, 0.23]} />
            <meshStandardMaterial color="#c8c8c8" roughness={0.95} />
          </mesh>
          {/* Pen on papers */}
          <mesh position={[0.02, 0.02, -0.02]} rotation={[0, 0.6, 0.1]} castShadow>
            <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
            <meshStandardMaterial color="#111111" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Small keyboard */}
      {hasKeyboard && (
        <mesh position={[0.05, 0.33, 0.18]} rotation={[0.02, 0.1, 0]} castShadow>
          <boxGeometry args={[0.22, 0.012, 0.08]} />
          <meshStandardMaterial color="#0f0f0f" roughness={0.75} />
        </mesh>
      )}

      {/* Tiny plant on desk (some desks) */}
      {hasTinyPlant && (
        <group position={[-0.35, 0.33, -0.18]}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.024, 0.06, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <icosahedronGeometry args={[0.04, 0]} />
            <meshStandardMaterial color="#122a22" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function Plant({ position, phase = 0 }: { position: [number, number]; phase?: number }) {
  const [x, z] = position;
  const groupRef = useRef<ThreeGroup>(null);

  // Leva panel is hidden in prod (office-scene). Keep defaults in prod builds.
  const HQ_PLANT_DEFAULTS = { plantSwaySpeed: 0.12, plantSwayAmp: 0.025 };
  const plantControls = useControls(
    "HQ Liveliness",
    {
      plantSwaySpeed: { value: 0.12, min: 0.01, max: 1, step: 0.01 },
      plantSwayAmp: { value: 0.025, min: 0, max: 0.2, step: 0.001 },
    },
    { collapsed: true },
  );
  const plant =
    process.env.NODE_ENV === "development" ? plantControls : HQ_PLANT_DEFAULTS;

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime * plant.plantSwaySpeed + phase;
      // Extremely gentle sway + tiny height bob. Feels alive but not distracting.
      groupRef.current.rotation.y = Math.sin(t) * plant.plantSwayAmp;
      groupRef.current.rotation.x = Math.sin(t * 0.7 + 1.3) * (plant.plantSwayAmp * 0.5);
      groupRef.current.position.y = Math.sin(t * 1.1) * 0.003;
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.36, 16]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#1f3a2c" roughness={0.85} />
      </mesh>
    </group>
  );
}

/**
 * Very subtle breathing on the monitor screen + faint varied "content".
 * Different desks look like they have different work on screen (very low contrast).
 */
function Monitor({ position, seed = 0 }: { position: [number, number, number]; seed?: number }) {
  const ref = useRef<Mesh>(null);

  // Deterministic screen variation (0,1,2,3)
  const variant = Math.abs(seed) % 4;

  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as any;
      if (mat && "emissiveIntensity" in mat) {
        // Very gentle sine wave, slow breathing
        mat.emissiveIntensity = 0.28 + Math.sin(state.clock.elapsedTime * 0.9) * 0.07;
      }
    }
  });

  return (
    <group position={position}>
      {/* Base screen glass */}
      <mesh ref={ref} castShadow>
        <boxGeometry args={[0.46, 0.28, 0.04]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.3}
          metalness={0.45}
          emissive="#121212"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Faint varied screen content (almost invisible unless looked at) */}
      {variant === 0 && (
        <>
          {/* Two text-like rows */}
          <mesh position={[0, 0.04, 0.025]}>
            <boxGeometry args={[0.32, 0.008, 0.002]} />
            <meshStandardMaterial color="#1f1f1f" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.03, 0.025]}>
            <boxGeometry args={[0.28, 0.008, 0.002]} />
            <meshStandardMaterial color="#1f1f1f" roughness={0.9} />
          </mesh>
        </>
      )}

      {variant === 1 && (
        <>
          {/* "Code" vertical bars + small accents */}
          <mesh position={[-0.08, 0, 0.025]}>
            <boxGeometry args={[0.006, 0.18, 0.002]} />
            <meshStandardMaterial color="#202020" roughness={0.9} />
          </mesh>
          <mesh position={[0.03, 0.02, 0.025]}>
            <boxGeometry args={[0.14, 0.006, 0.002]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.9} />
          </mesh>
          <mesh position={[0.03, -0.02, 0.025]}>
            <boxGeometry args={[0.1, 0.006, 0.002]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.9} />
          </mesh>
        </>
      )}

      {variant === 2 && (
        <>
          {/* Subtle grid / table feel */}
          {[ -0.06, 0.06 ].map((y, i) => (
            <mesh key={i} position={[0, y, 0.025]}>
              <boxGeometry args={[0.34, 0.004, 0.002]} />
              <meshStandardMaterial color="#1e1e1e" roughness={0.9} />
            </mesh>
          ))}
          {[ -0.1, 0.1 ].map((x, i) => (
            <mesh key={i + 10} position={[x, 0, 0.025]}>
              <boxGeometry args={[0.004, 0.16, 0.002]} />
              <meshStandardMaterial color="#1e1e1e" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}

      {variant === 3 && (
        <>
          {/* One main "window" + status line */}
          <mesh position={[0, 0.01, 0.025]}>
            <boxGeometry args={[0.26, 0.14, 0.002]} />
            <meshStandardMaterial color="#181818" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.08, 0.025]}>
            <boxGeometry args={[0.36, 0.004, 0.002]} />
            <meshStandardMaterial color="#222222" roughness={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

function deskPositions(room: RoomDef): Array<[number, number]> {
  const count = Math.min(3, Math.max(1, Math.round((room.w * room.d) / 22)));
  const spread = room.w * 0.5;
  const z = room.z - room.d * 0.18;
  if (count === 1) {
    return [[room.x, z]];
  }
  return Array.from({ length: count }, (_, index) => {
    const fx = count === 1 ? 0.5 : index / (count - 1);
    return [room.x - spread / 2 + fx * spread, z] as [number, number];
  });
}

/** Small scattered papers on the floor (живность) */
function FloorPaper({ position, rot = 0 }: { position: [number, number]; rot?: number }) {
  const [x, z] = position;
  return (
    <group position={[x, 0.015, z]} rotation={[0, rot, 0]}>
      <mesh>
        <planeGeometry args={[0.22, 0.16]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.95} side={2} />
      </mesh>
      <mesh position={[0.01, 0.001, -0.01]} rotation={[0, 0.2, 0]}>
        <planeGeometry args={[0.18, 0.13]} />
        <meshStandardMaterial color="#252525" roughness={0.95} side={2} />
      </mesh>
    </group>
  );
}

/** Loose cable on the floor */
function FloorCable({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(x2 - x1, z2 - z1);
  return (
    <mesh position={[midX, 0.013, midZ]} rotation={[0, angle + Math.PI / 2, 0]}>
      <cylinderGeometry args={[0.008, 0.008, len, 4]} />
      <meshStandardMaterial color="#0c0c0c" roughness={0.95} />
    </mesh>
  );
}

export function OfficeRoom({ room }: { room: SceneRoom }) {
  const { def, label, occupied, capacity } = room;
  const halfW = def.w / 2;
  const halfD = def.d / 2;
  const wallY = WALL_HEIGHT / 2;

  // Executive / critical zones get black accent panels; everything else uses
  // architectural concrete. (Glass dividers are reserved for open-space edges.)
  const wallVariant: WallVariant =
    def.department === "executive" ? "accent" : "concrete";

  const labelZ = def.walls.north
    ? def.z - halfD
    : def.walls.south
      ? def.z + halfD
      : def.z;

  return (
    <group>
      {/* Floor inlay to delineate the department footprint */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[def.x, 0.012, def.z]}
        receiveShadow
      >
        <planeGeometry args={[def.w - 0.1, def.d - 0.1]} />
        <meshStandardMaterial
          color="#0c0c0c"
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>

      {/* Subtle carpet / zone marker closer to desks (helps read the map) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[def.x, 0.013, def.z - def.d * 0.12]}
        receiveShadow
      >
        <planeGeometry args={[def.w * 0.78, def.d * 0.58]} />
        <meshStandardMaterial color="#121212" roughness={0.65} metalness={0.1} />
      </mesh>

      {def.walls.north ? (
        <Wall
          position={[def.x, wallY, def.z - halfD]}
          args={[def.w, WALL_HEIGHT, WALL_THICKNESS]}
          variant={wallVariant}
        />
      ) : null}
      {def.walls.south ? (
        <Wall
          position={[def.x, wallY, def.z + halfD]}
          args={[def.w, WALL_HEIGHT, WALL_THICKNESS]}
          variant={wallVariant}
        />
      ) : null}
      {def.walls.west ? (
        <Wall
          position={[def.x - halfW, wallY, def.z]}
          args={[WALL_THICKNESS, WALL_HEIGHT, def.d]}
          variant={wallVariant}
        />
      ) : null}
      {def.walls.east ? (
        <Wall
          position={[def.x + halfW, wallY, def.z]}
          args={[WALL_THICKNESS, WALL_HEIGHT, def.d]}
          variant={wallVariant}
        />
      ) : null}

      {/* Desks + chairs from DeskSlot (mesh ↔ collider ↔ seat). */}
      {getDeskSlots(def).map((slot, index) => (
        <group key={slot.id}>
          <Desk
            position={slot.desk}
            seed={(def.x * 100 + def.z * 10 + index) | 0}
          />
          <group position={[slot.seat[0], 0, slot.seat[1]]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.38, 0.08, 0.38]} />
              <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.42, -0.12]} castShadow>
              <boxGeometry args={[0.36, 0.32, 0.06]} />
              <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} />
            </mesh>
          </group>
        </group>
      ))}

      {def.w * def.d > 28 ? (
        <>
          <Plant
            position={[def.x - halfW + 0.65, def.z + halfD - 0.65]}
            phase={((def.x + def.z) * 0.9) % (Math.PI * 2)}
          />
          <Plant
            position={[def.x + halfW - 0.65, def.z - halfD + 0.55]}
            phase={((def.x - def.z) * 1.1 + 2) % (Math.PI * 2)}
          />
        </>
      ) : null}

      {/* Floor papers + cables for lived-in feel (only in bigger rooms) */}
      {def.w * def.d > 26 && (
        <>
          <FloorPaper position={[def.x - 1.6, def.z + 1.1]} rot={0.6} />
          <FloorPaper position={[def.x + 1.4, def.z - 0.9]} rot={-0.9} />
          <FloorCable from={[def.x - 1.1, def.z + 0.9]} to={[def.x - 0.4, def.z + 1.3]} />
        </>
      )}

      <Html
        position={[def.x, WALL_HEIGHT + 0.22, labelZ]}
        center
        zIndexRange={[10, 0]}
        wrapperClass="pointer-events-none"
      >
        <div className="pointer-events-none flex select-none items-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-white/90 px-2.5 py-1">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-black uppercase">
            {label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-black/55">
            {occupied}/{capacity}
          </span>
        </div>
      </Html>
    </group>
  );
}
