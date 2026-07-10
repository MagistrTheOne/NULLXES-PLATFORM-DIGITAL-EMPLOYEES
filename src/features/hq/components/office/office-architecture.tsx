"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { Mesh } from "three";
import { OFFICE_ROOMS, WALL_HEIGHT } from "../../lib/office-layout";

/**
 * Architectural shell for the HQ: floors, ceiling and structural light system.
 *
 * Nav graph for agent locomotion lives in `nav-graph.ts` / `hq-nav-controller.ts`
 * and is intentionally invisible — no LED web on the floor.
 */

const CEILING_Y = WALL_HEIGHT + 3.6;

/* ----------------------------- Floor system ------------------------------ */

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

export function FloorSystem() {
  return (
    <group>
      {/* Base — matte black marble with soft reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          color="#0a0a0b"
          metalness={0.45}
          roughness={0.55}
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1.0}
          mixStrength={1.2}
          depthScale={0.6}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          mirror={0.22}
        />
      </mesh>

      {/* Quiet service pads — no emissive nav web */}
      <ConcreteStrip position={[-1.8, -7.2]} size={[3.0, 1.6]} />
      <ConcreteStrip position={[0, 0.2]} size={[4.2, 4.2]} />
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
