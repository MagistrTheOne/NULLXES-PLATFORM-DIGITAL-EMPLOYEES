"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useOfficeStore } from "../../store/use-office-store";
import { OfficeEmployee } from "./office-employee";
import { HQ_MODELS } from "./office-models";
import { OfficeProps } from "./office-props";
import { OfficeRoom, Plant } from "./office-room";
import type { SceneEmployee, SceneRoom } from "./scene-types";

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

function MarbleFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        color="#3a3c40"
        metalness={0.35}
        roughness={0.65}
        blur={[280, 90]}
        resolution={1024}
        mixBlur={1.0}
        mixStrength={2.1}
        depthScale={0.9}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.5}
        mirror={0.3}
      />
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

export default function OfficeScene({
  rooms,
  employees,
  controlsRef,
}: {
  rooms: SceneRoom[];
  employees: SceneEmployee[];
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const selectEmployee = useOfficeStore((state) => state.selectEmployee);
  const draggingId = useOfficeStore((state) => state.draggingId);

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [22, 18, 22], zoom: 34, near: 1, far: 240 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
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

        <MarbleFloor />
        {rooms.map((room) => (
          <OfficeRoom key={room.def.department} room={room} />
        ))}

        {/* Extra ambient plants around the central atrium for more life */}
        <Plant position={[-6.5, -3.8]} phase={1.7} />
        <Plant position={[7.2, 4.1]} phase={4.2} />

        {/* Scattered floor papers in the open atrium */}
        <group position={[-3.5, 0.015, -1.2]} rotation={[0, 0.7, 0]}>
          <mesh>
            <planeGeometry args={[0.2, 0.15]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.95} side={2} />
          </mesh>
        </group>
        <group position={[4.1, 0.015, 2.8]} rotation={[0, -1.1, 0]}>
          <mesh>
            <planeGeometry args={[0.17, 0.12]} />
            <meshStandardMaterial color="#222222" roughness={0.95} side={2} />
          </mesh>
        </group>

        {/* Simple coffee station in the atrium (visual liveliness) */}
        <group position={[-1.8, 0, -7.2]}>
          {/* Counter */}
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.08, 0.7]} />
            <meshStandardMaterial color="#181818" roughness={0.6} />
          </mesh>
          {/* Coffee machine body */}
          <mesh position={[-0.35, 0.72, 0]} castShadow>
            <boxGeometry args={[0.42, 0.52, 0.46]} />
            <meshStandardMaterial color="#121212" roughness={0.5} metalness={0.15} />
          </mesh>
          {/* Drip area highlight */}
          <mesh position={[-0.35, 0.52, 0.28]} castShadow>
            <boxGeometry args={[0.28, 0.08, 0.08]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* Cup on counter */}
          <mesh position={[0.55, 0.52, 0.1]} castShadow>
            <cylinderGeometry args={[0.05, 0.045, 0.1, 10]} />
            <meshStandardMaterial color="#1f1f1f" roughness={0.7} />
          </mesh>
        </group>

        {HQ_MODELS.props ? (
          <Suspense fallback={null}>
            <OfficeProps url={HQ_MODELS.props} />
          </Suspense>
        ) : null}

        {employees.map((employee) => (
          <OfficeEmployee key={employee.id} employee={employee} />
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
  );
}
