"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { Mesh } from "three";
import { OFFICE_ROOMS, WALL_HEIGHT } from "../../lib/office-layout";

/**
 * Architectural shell for the HQ: floors, ceiling and structural light system.
 *
 * Material language (strictly black / white / gray, no neon):
 *  Floors  — matte black marble (base), light-gray tech concrete (service zones),
 *            tinted glass inserts (data paths), thin white LED navigation lines.
 *  Ceiling — hidden recessed grid light system, ventilation plates, sparse LED
 *            "petals" over each zone (a quiet sense of overhead attention).
 *
 * Kept sparse so the orthographic top-down camera still reads the floor clearly.
 */

const CEILING_Y = WALL_HEIGHT + 3.6;

/* ----------------------------- Floor system ------------------------------ */

/** A single thin emissive navigation line laid into the floor. */
function LedLine({
  from,
  to,
  width = 0.05,
  intensity = 0.9,
  y = 0.02,
}: {
  from: [number, number];
  to: [number, number];
  width?: number;
  intensity?: number;
  y?: number;
}) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(x2 - x1, z2 - z1);
  return (
    <mesh position={[midX, y, midZ]} rotation={[-Math.PI / 2, 0, -angle]}>
      <planeGeometry args={[width, len]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={intensity}
        roughness={0.4}
        metalness={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Light-gray technical-concrete service strip. */
function ConcreteStrip({
  position,
  size,
}: {
  position: [number, number];
  size: [number, number];
}) {
  const [x, z] = position;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, z]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#5f6266" roughness={0.95} metalness={0.04} />
    </mesh>
  );
}

/** Tinted glass insert — reads as a "data path" channel in the floor. */
function GlassInsert({
  position,
  size,
}: {
  position: [number, number];
  size: [number, number];
}) {
  const [x, z] = position;
  return (
    <group position={[x, 0, z]}>
      {/* Glass surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color="#0c0e10"
          roughness={0.08}
          metalness={0.6}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Faint inner glow line down the channel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <planeGeometry args={[size[0] * 0.18, size[1] * 0.96]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#cfd2d6"
          emissiveIntensity={0.35}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

export function FloorSystem() {
  // Build a navigation network: a central spine + spurs to each department.
  const center: [number, number] = [0, 0];
  const spurs = Object.values(OFFICE_ROOMS).map(
    (room) => [room.x, room.z] as [number, number],
  );

  return (
    <group>
      {/* Base — matte black marble with soft reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          color="#0a0a0b"
          metalness={0.55}
          roughness={0.5}
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1.0}
          mixStrength={1.6}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          mirror={0.35}
        />
      </mesh>

      {/* Service zones — light-gray tech concrete (atrium edges + coffee/service strip) */}
      <ConcreteStrip position={[-1.8, -7.2]} size={[3.0, 1.6]} />
      <ConcreteStrip position={[0, 0]} size={[5.4, 5.4]} />

      {/* Glass data-path inserts flowing toward analytics */}
      <GlassInsert position={[-3, 3.4]} size={[0.5, 5.2]} />
      <GlassInsert position={[3.2, 3.0]} size={[0.5, 4.4]} />

      {/* === LED navigation lines (very important) === */}
      {/* Central spine */}
      <LedLine from={[-13, 0]} to={[12, 0]} width={0.06} intensity={1.0} />
      <LedLine from={[0, -8]} to={[0, 8]} width={0.06} intensity={1.0} />
      {/* Spurs from center to each department zone */}
      {spurs.map((p, i) => (
        <LedLine key={i} from={center} to={p} width={0.035} intensity={0.6} />
      ))}
      {/* Soft glow accents at the central junction */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <ringGeometry args={[0.5, 0.58, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ---------------------------- Ceiling system ----------------------------- */

/** A structural ceiling beam with a recessed white light line inset. */
function CeilingBeam({
  position,
  length,
  axis,
}: {
  position: [number, number, number];
  length: number;
  axis: "x" | "z";
}) {
  const [x, y, z] = position;
  const isX = axis === "x";
  return (
    <group position={[x, y, z]}>
      {/* Beam body */}
      <mesh castShadow>
        <boxGeometry args={isX ? [length, 0.12, 0.16] : [0.16, 0.12, length]} />
        <meshStandardMaterial color="#161616" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Recessed light line (hidden grid light system) */}
      <mesh position={[0, -0.065, 0]}>
        <boxGeometry
          args={isX ? [length * 0.98, 0.02, 0.04] : [0.04, 0.02, length * 0.98]}
        />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Flat ventilation plate with a faint grille. */
function VentPlate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.3, 0.06, 1.3]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Grille slats */}
      {[-0.4, -0.13, 0.13, 0.4].map((o, i) => (
        <mesh key={i} position={[0, -0.04, o]}>
          <boxGeometry args={[1.1, 0.01, 0.06]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Sparse round LED "petal" over a zone — a quiet pool of overhead attention. */
function LedPetal({
  position,
  pulsePhase = 0,
}: {
  position: [number, number, number];
  pulsePhase?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * 0.5 + pulsePhase;
      const mat = ref.current.material as { emissiveIntensity?: number };
      if (mat && typeof mat.emissiveIntensity === "number") {
        mat.emissiveIntensity = 0.45 + (Math.sin(t) * 0.5 + 0.5) * 0.35;
      }
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.55, 40]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5}
        toneMapped={false}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

export function CeilingSystem() {
  // Sparse beam grid over the interior so the camera still reads the floor.
  const beamXs = [-12, -4, 4, 11];
  const beamZs = [-6.5, 0.5, 7];
  const interiorLenX = 28; // along X
  const interiorLenZ = 18; // along Z

  const zones = Object.values(OFFICE_ROOMS).map(
    (room) => [room.x, room.z] as [number, number],
  );

  return (
    <group>
      {/* Beams running along Z at fixed X */}
      {beamXs.map((x, i) => (
        <CeilingBeam
          key={`bx-${i}`}
          axis="z"
          length={interiorLenZ}
          position={[x, CEILING_Y, 0.5]}
        />
      ))}
      {/* Beams running along X at fixed Z */}
      {beamZs.map((z, i) => (
        <CeilingBeam
          key={`bz-${i}`}
          axis="x"
          length={interiorLenX}
          position={[-1, CEILING_Y, z]}
        />
      ))}

      {/* Ventilation plates dropped a touch below the beams */}
      <VentPlate position={[-5, CEILING_Y - 0.12, -3]} />
      <VentPlate position={[6, CEILING_Y - 0.12, 4]} />
      <VentPlate position={[-9, CEILING_Y - 0.12, 5]} />

      {/* LED petals — one quiet pool of light over each zone */}
      {zones.map(([x, z], i) => (
        <LedPetal
          key={`petal-${i}`}
          position={[x, CEILING_Y - 0.2, z]}
          pulsePhase={i * 1.3}
        />
      ))}
    </group>
  );
}
