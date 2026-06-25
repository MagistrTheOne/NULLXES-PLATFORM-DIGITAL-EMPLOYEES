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
import { OfficeRoom } from "./office-room";
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

function MarbleFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        color="#43464b"
        metalness={0.45}
        roughness={0.6}
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1.2}
        mixStrength={3}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        mirror={0.4}
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

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: [22, 18, 22], zoom: 34, near: 1, far: 240 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      dpr={[1, 2]}
      onPointerMissed={() => selectEmployee(null)}
      className="!absolute inset-0"
    >
      <color attach="background" args={["#d2d5d9"]} />
      <fog attach="fog" args={["#d2d5d9", 55, 110]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.75} />
        <hemisphereLight intensity={0.55} groundColor="#9a9da2" color="#ffffff" />
        <directionalLight
          position={[14, 22, 10]}
          intensity={1.25}
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
        <directionalLight position={[-16, 12, -8]} intensity={0.4} />

        {/* Soft overhead wash, pooling light on the marble like a ceiling. */}
        <spotLight
          position={[0, 24, 2]}
          angle={0.85}
          penumbra={1}
          intensity={1.4}
          distance={70}
          decay={0}
          color="#ffffff"
        />
        {/* Per-room ceiling glow so each department reads as a lit space. */}
        {CEILING_LIGHTS.map(([x, z], index) => (
          <pointLight
            key={index}
            position={[x, 5.5, z]}
            intensity={0.55}
            distance={16}
            decay={1.4}
            color="#f5f5f5"
          />
        ))}

        <MarbleFloor />
        {rooms.map((room) => (
          <OfficeRoom key={room.def.department} room={room} />
        ))}

        {HQ_MODELS.props ? (
          <Suspense fallback={null}>
            <OfficeProps url={HQ_MODELS.props} />
          </Suspense>
        ) : null}

        {employees.map((employee) => (
          <OfficeEmployee key={employee.id} employee={employee} />
        ))}
      </Suspense>

      <CameraRig employees={employees} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
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
