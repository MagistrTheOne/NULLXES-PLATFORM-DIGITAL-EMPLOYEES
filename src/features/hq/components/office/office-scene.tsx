"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useOfficeStore } from "../../store/use-office-store";
import { OfficeEmployee } from "./office-employee";
import { OfficeRoom } from "./office-room";
import type { SceneEmployee, SceneRoom } from "./scene-types";

function MarbleFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        color="#070707"
        metalness={0.65}
        roughness={0.45}
        blur={[420, 120]}
        resolution={1024}
        mixBlur={1.1}
        mixStrength={5}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        mirror={0.55}
      />
    </mesh>
  );
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
      camera={{ position: [20, 17, 20], zoom: 40, near: 1, far: 240 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      dpr={[1, 2]}
      onPointerMissed={() => selectEmployee(null)}
      className="!absolute inset-0"
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 45, 95]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <hemisphereLight intensity={0.25} groundColor="#000000" color="#ffffff" />
        <directionalLight
          position={[14, 22, 10]}
          intensity={1.35}
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
        <directionalLight position={[-16, 12, -8]} intensity={0.35} />

        <Environment resolution={256}>
          <Lightformer
            form="rect"
            intensity={2}
            position={[0, 12, 0]}
            scale={[20, 8, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.2}
            position={[12, 6, 12]}
            scale={[8, 8, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.8}
            position={[-12, 6, -12]}
            scale={[8, 8, 1]}
          />
        </Environment>

        <MarbleFloor />

        {rooms.map((room) => (
          <OfficeRoom key={room.def.department} room={room} />
        ))}

        {employees.map((employee) => (
          <OfficeEmployee key={employee.id} employee={employee} />
        ))}
      </Suspense>

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
