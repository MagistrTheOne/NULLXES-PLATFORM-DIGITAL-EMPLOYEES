"use client";

import { Html, RoundedBox } from "@react-three/drei";
import {
  WALL_HEIGHT,
  WALL_THICKNESS,
  type RoomDef,
} from "../../lib/office-layout";
import type { SceneRoom } from "./scene-types";

const WALL_COLOR = "#e9e9e9";
const DESK_COLOR = "#141414";

function Wall({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.82} metalness={0.02} />
    </mesh>
  );
}

function Desk({ position }: { position: [number, number] }) {
  const [x, z] = position;
  return (
    <group position={[x, 0, z]}>
      <RoundedBox
        args={[1.1, 0.32, 0.62]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={DESK_COLOR} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* Monitor */}
      <mesh position={[0, 0.5, -0.12]} castShadow>
        <boxGeometry args={[0.42, 0.26, 0.03]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.3}
          metalness={0.4}
          emissive="#1a1a1a"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number] }) {
  const [x, z] = position;
  return (
    <group position={[x, 0, z]}>
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

export function OfficeRoom({ room }: { room: SceneRoom }) {
  const { def, label } = room;
  const halfW = def.w / 2;
  const halfD = def.d / 2;
  const wallY = WALL_HEIGHT / 2;

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

      {def.walls.north ? (
        <Wall
          position={[def.x, wallY, def.z - halfD]}
          args={[def.w, WALL_HEIGHT, WALL_THICKNESS]}
        />
      ) : null}
      {def.walls.south ? (
        <Wall
          position={[def.x, wallY, def.z + halfD]}
          args={[def.w, WALL_HEIGHT, WALL_THICKNESS]}
        />
      ) : null}
      {def.walls.west ? (
        <Wall
          position={[def.x - halfW, wallY, def.z]}
          args={[WALL_THICKNESS, WALL_HEIGHT, def.d]}
        />
      ) : null}
      {def.walls.east ? (
        <Wall
          position={[def.x + halfW, wallY, def.z]}
          args={[WALL_THICKNESS, WALL_HEIGHT, def.d]}
        />
      ) : null}

      {deskPositions(def).map((position, index) => (
        <Desk key={`desk-${index}`} position={position} />
      ))}

      {def.w * def.d > 30 ? (
        <Plant position={[def.x - halfW + 0.7, def.z + halfD - 0.7]} />
      ) : null}

      <Html
        position={[def.x, WALL_HEIGHT + 0.22, labelZ]}
        center
        zIndexRange={[10, 0]}
        wrapperClass="pointer-events-none"
      >
        <div className="pointer-events-none flex select-none whitespace-nowrap rounded-md border border-white/10 bg-white/90 px-2.5 py-1">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-black uppercase">
            {label}
          </span>
        </div>
      </Html>
    </group>
  );
}
