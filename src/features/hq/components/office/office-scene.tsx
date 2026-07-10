"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Leva } from "leva";
import { PCFShadowMap, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useOfficeStore } from "../../store/use-office-store";
import { OfficeEmployee } from "./office-employee";
import { FloorSystem, CeilingSystem } from "./office-architecture";
import { CentralOperationsTable } from "./central-operations-table";
import { OfficeRoom, Plant } from "./office-room";
import type { SceneEmployee, SceneRoom } from "./scene-types";
import type { HqOpsItem } from "../../types";

/** Overhead ceiling-light positions (x, z) over each department cluster. */
const CEILING_LIGHTS: Array<[number, number]> = [
  [-5, -6.5],
  [5.5, -6.5],
  [-5, 7],
  [5.5, 7],
  [11.5, 1],
  [-12.5, 0.5],
];

/**
 * Transparent full-bleed plane mounted only while dragging. It captures pointer
 * move/up across the whole canvas and reports the world position under the
 * cursor, so a grabbed employee follows the mouse even off its own mesh.
 */
function DragPlane() {
  const updateDragTarget = useOfficeStore((state) => state.updateDragTarget);
  const endDrag = useOfficeStore((state) => state.endDrag);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      onPointerMove={(event) => {
        event.stopPropagation();
        updateDragTarget([event.point.x, event.point.z]);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        endDrag();
        document.body.style.cursor = "default";
      }}
      onPointerLeave={() => {
        endDrag();
        document.body.style.cursor = "default";
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/**
 * Smoothly recenters the orbit target on the selected employee so the active
 * digital employee is always framed in the canvas (and never tucked behind the
 * profile card). Only re-runs when the selected target actually changes, so it
 * doesn't fight manual panning or periodic data refreshes.
 */
function CameraRig({
  employees,
  controlsRef,
}: {
  employees: SceneEmployee[];
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const selectedId = useOfficeStore((state) => state.selectedEmployeeId);
  const selected = employees.find((employee) => employee.id === selectedId);
  const px = selected ? selected.position[0] : 0;
  const pz = selected ? selected.position[1] : 0;
  const desired = useRef(new Vector3(0, 0.5, 0));
  const focusing = useRef(false);

  useEffect(() => {
    desired.current.set(px, 0.5, pz);
    focusing.current = true;
  }, [px, pz]);

  useFrame(() => {
    if (!focusing.current) {
      return;
    }
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }
    controls.target.lerp(desired.current, 0.08);
    controls.update();
    if (controls.target.distanceTo(desired.current) < 0.03) {
      focusing.current = false;
    }
  });

  return null;
}

/**
 * Very quiet wall clock. Slow moving hands for a tiny bit of passing time feel.
 */
function WallClock({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const minuteRef = useRef<any>(null);
  const hourRef = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.015; // very slow
    if (minuteRef.current) {
      minuteRef.current.rotation.z = -t * 6;
    }
    if (hourRef.current) {
      hourRef.current.rotation.z = -t * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Face */}
      <mesh>
        <circleGeometry args={[0.32]} />
        <meshStandardMaterial color="#121212" roughness={0.8} />
      </mesh>
      {/* Subtle rim */}
      <mesh>
        <ringGeometry args={[0.32, 0.34, 32]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.7} />
      </mesh>
      {/* Center */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.03]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Hour hand (pivot at clock center) */}
      <group ref={hourRef}>
        <mesh position={[0, 0.09, 0.02]}>
          <boxGeometry args={[0.025, 0.18, 0.01]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
      </group>

      {/* Minute hand (pivot at clock center) */}
      <group ref={minuteRef}>
        <mesh position={[0, 0.13, 0.025]}>
          <boxGeometry args={[0.018, 0.26, 0.01]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </group>
    </group>
  );
}

export default function OfficeScene({
  rooms,
  employees,
  controlsRef,
  opsItems = [],
}: {
  rooms: SceneRoom[];
  employees: SceneEmployee[];
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  opsItems?: HqOpsItem[];
}) {
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);
  const draggingId = useOfficeStore((state) => state.draggingId);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <>
      {/* Leva debug panel only in development. Hidden in prod builds. */}
      <Leva hidden={!isDev} />

      <Canvas
        shadows
        orthographic
        camera={{ position: [22, 18, 22], zoom: 34, near: 1, far: 240 }}
        gl={{ antialias: true, preserveDrawingBuffer: false }}
        // Explicitly set a non-deprecated shadow map type via onCreated.
        // Passing shadowMap inside gl is not valid (gl only takes WebGLRendererParameters).
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFShadowMap;
        }}
        dpr={[1, 2]}
        onPointerMissed={() => selectEmployee(null)}
        className="absolute! inset-0"
      >
      {/* Dark elegant background matching the polished marble concept */}
      <color attach="background" args={["#0f0f0f"]} />
      <fog attach="fog" args={["#0f0f0f", 48, 95]} />

      <Suspense fallback={null}>
        {/* Softer, more even base lighting (less "black or white") */}
        <ambientLight intensity={0.82} />
        <hemisphereLight intensity={0.65} groundColor="#1f1f1f" color="#c8c8c8" />

        {/* Main key light - reduced intensity for gentler contrast */}
        <directionalLight
          position={[14, 22, 10]}
          intensity={0.95}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={1}
          shadow-camera-far={80}
          shadow-bias={-0.0004}
        />

        {/* Fill light from opposite side for softer modeling */}
        <directionalLight position={[-18, 14, -10]} intensity={0.55} />

        {/* Gentle overhead ceiling wash */}
        <spotLight
          position={[0, 24, 2]}
          angle={0.9}
          penumbra={1}
          intensity={0.95}
          distance={70}
          decay={0}
          color="#e8e8e8"
        />

        {/* Subtle per-room ceiling accents (not too bright) */}
        {CEILING_LIGHTS.map(([x, z], index) => (
          <pointLight
            key={index}
            position={[x, 5.5, z]}
            intensity={0.38}
            distance={15}
            decay={1.6}
            color="#d8d8d8"
          />
        ))}

        {/* Architectural shell — floors + overhead ceiling grid */}
        <FloorSystem />
        <CeilingSystem />

        {rooms.map((room) => (
          <OfficeRoom key={room.def.department} room={room} />
        ))}

        {/* Quiet atrium plants — kept sparse */}
        <Plant position={[-6.5, -3.8]} phase={1.7} />
        <Plant position={[7.2, 4.1]} phase={4.2} />

        {/* Central Operations Table — product center, not decorative geometry */}
        <CentralOperationsTable items={opsItems} />

        {/* Subtle wall clock (quiet liveliness) */}
        <WallClock position={[-9.2, 2.15, -3.8]} rotation={[0, 1.05, 0]} />

        {employees.map((employee) => (
          <OfficeEmployee key={employee.id} employee={employee} allEmployees={employees} />
        ))}

        {draggingId ? <DragPlane /> : null}
      </Suspense>

      <CameraRig employees={employees} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={draggingId === null}
        enablePan
        enableZoom
        enableRotate
        target={[0, 0.5, 0]}
        minZoom={24}
        maxZoom={110}
        minPolarAngle={0.55}
        maxPolarAngle={1.15}
        enableDamping
        dampingFactor={0.12}
      />
      </Canvas>
    </>
  );
}
