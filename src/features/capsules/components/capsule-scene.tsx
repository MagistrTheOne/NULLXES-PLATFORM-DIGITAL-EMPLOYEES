"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Bounds, Center, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";

function CapsuleModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => scene.clone(true), [scene]);
  const ref = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
    // Soft idle bob — enterprise micro-motion, not game bounce
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.035;
  });

  return (
    <Bounds fit clip observe margin={1.35}>
      <Center>
        <group ref={ref}>
          <primitive object={root} />
        </group>
      </Center>
    </Bounds>
  );
}

export default function CapsuleScene({ glb }: { glb: string }) {
  useEffect(() => {
    useGLTF.preload(glb);
  }, [glb]);

  return (
    <Canvas
      camera={{ position: [0, 0.2, 2.55], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={["#0c0c0c"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 4, 2]} intensity={1.2} />
      <directionalLight position={[-2, 1.5, -1]} intensity={0.4} />
      <Suspense fallback={null}>
        <CapsuleModel url={glb} />
      </Suspense>
    </Canvas>
  );
}
