"use client";

import { Html } from "@react-three/drei";
import type { HqOpsItem } from "../../types";

const TABLE_RADIUS = 2.35;
const TABLE_HEIGHT = 0.72;

/**
 * Central Operations Table — replaces decorative atrium props.
 * Html overlays must NOT use distanceFactor under orthographic camera
 * (it scales into giant “letters” that cover the floor).
 */
export function CentralOperationsTable({
  items = [],
}: {
  items?: HqOpsItem[];
}) {
  const visible = items.slice(0, 4);

  return (
    <group position={[0, 0, 0.2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} receiveShadow>
        <ringGeometry args={[TABLE_RADIUS + 0.15, TABLE_RADIUS + 0.35, 64]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.55}
          metalness={0.45}
        />
      </mesh>

      <mesh position={[0, TABLE_HEIGHT / 2 - 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.72, TABLE_HEIGHT - 0.12, 32]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.7} metalness={0.25} />
      </mesh>

      <mesh position={[0, TABLE_HEIGHT, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[TABLE_RADIUS, TABLE_RADIUS, 0.08, 64]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>

      <mesh position={[0, TABLE_HEIGHT + 0.045, 0]}>
        <torusGeometry args={[TABLE_RADIUS - 0.02, 0.025, 8, 64]} />
        <meshStandardMaterial
          color="#c8c8c8"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TABLE_HEIGHT + 0.05, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.25}
          toneMapped={false}
          transparent
          opacity={0.35}
        />
      </mesh>

      {visible.map((item, index) => {
        const angle =
          (index / Math.max(visible.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const r = TABLE_RADIUS * 0.55;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return (
          <group key={item.id} position={[x, TABLE_HEIGHT + 0.12, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.85, 0.02, 0.52]} />
              <meshStandardMaterial
                color={item.kind === "approval" ? "#1a1a1a" : "#141414"}
                roughness={0.5}
                metalness={0.3}
              />
            </mesh>
            <Html
              position={[0, 0.06, 0]}
              center
              zIndexRange={[20, 0]}
              wrapperClass="pointer-events-none"
            >
              <div className="pointer-events-none w-[100px] select-none rounded border border-white/15 bg-black/85 px-2 py-1 shadow-lg">
                <p className="text-[8px] font-medium tracking-[0.14em] text-white/45 uppercase">
                  {item.kind}
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-white/90">
                  {item.title}
                </p>
                {item.subtitle ? (
                  <p className="mt-0.5 truncate text-[9px] text-white/40">
                    {item.subtitle}
                  </p>
                ) : null}
              </div>
            </Html>
          </group>
        );
      })}

      {visible.length === 0 ? (
        <Html
          position={[0, TABLE_HEIGHT + 0.18, 0]}
          center
          zIndexRange={[20, 0]}
          wrapperClass="pointer-events-none"
        >
          <div className="pointer-events-none select-none rounded border border-white/10 bg-black/70 px-3 py-1.5">
            <p className="text-[9px] tracking-[0.16em] text-white/40 uppercase">
              Operations
            </p>
            <p className="mt-0.5 text-[10px] text-white/55">Clear</p>
          </div>
        </Html>
      ) : null}
    </group>
  );
}
