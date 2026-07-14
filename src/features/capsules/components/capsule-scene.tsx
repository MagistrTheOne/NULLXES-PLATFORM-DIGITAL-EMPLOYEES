"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Bounds, Center, Environment, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { SRGBColorSpace } from "three";

function fixCapsuleMaterials(root: Group) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material || typeof material !== "object") continue;
      const mat = material as {
        map?: { colorSpace?: string; needsUpdate?: boolean } | null;
        emissiveMap?: { colorSpace?: string; needsUpdate?: boolean } | null;
        needsUpdate?: boolean;
      };
      if (mat.map) {
        mat.map.colorSpace = SRGBColorSpace;
        mat.map.needsUpdate = true;
      }
      if (mat.emissiveMap) {
        mat.emissiveMap.colorSpace = SRGBColorSpace;
        mat.emissiveMap.needsUpdate = true;
      }
      mat.needsUpdate = true;
    }
  });
}

function CapsuleModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => {
    const cloned = scene.clone(true);
    fixCapsuleMaterials(cloned);
    return cloned;
  }, [scene]);
  const ref = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
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
    // Bust cache if HQ blob-stub previously poisoned embedded maps this session.
    try {
      useGLTF.clear(glb);
    } catch {
      // ignore
    }
    useGLTF.preload(glb);
  }, [glb]);

  return (
    <Canvas
      camera={{ position: [0, 0.25, 2.6], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMappingExposure: 1.15,
      }}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={["#0c0c0c"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />
      <directionalLight position={[-2.5, 1.5, -1]} intensity={0.55} />
      <Environment preset="studio" environmentIntensity={0.35} />
      <Suspense fallback={null}>
        <CapsuleModel url={glb} />
      </Suspense>
    </Canvas>
  );
}
