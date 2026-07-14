"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Bounds, Center, Clone, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group, Mesh, Object3D, Texture } from "three";
import { SRGBColorSpace } from "three";

function collectTextures(root: Object3D): Texture[] {
  const textures: Texture[] = [];
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material || typeof material !== "object") continue;
      const mat = material as unknown as Record<string, unknown>;
      for (const key of [
        "map",
        "normalMap",
        "roughnessMap",
        "metalnessMap",
        "emissiveMap",
        "aoMap",
      ]) {
        const tex = mat[key];
        if (tex && typeof tex === "object" && "image" in (tex as object)) {
          textures.push(tex as Texture);
        }
      }
    }
  });
  return textures;
}

function prepareMaterials(root: Object3D) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material || typeof material !== "object") continue;
      const mat = material as {
        map?: Texture | null;
        emissiveMap?: Texture | null;
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

function waitForTextures(root: Object3D): Promise<boolean> {
  const textures = collectTextures(root);
  if (textures.length === 0) {
    // No maps — treat as not ready for swap (keep PNG)
    return Promise.resolve(false);
  }

  return Promise.all(
    textures.map(
      (tex) =>
        new Promise<void>((resolve) => {
          const image = tex.image as
            | (HTMLImageElement & { complete?: boolean })
            | ImageBitmap
            | HTMLCanvasElement
            | undefined;

          if (!image) {
            resolve();
            return;
          }
          if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
            resolve();
            return;
          }
          if ("complete" in image && image.complete && (image as HTMLImageElement).naturalWidth > 0) {
            resolve();
            return;
          }
          if (image instanceof HTMLCanvasElement && image.width > 0) {
            resolve();
            return;
          }

          const img = image as HTMLImageElement;
          const done = () => {
            img.removeEventListener?.("load", done);
            img.removeEventListener?.("error", done);
            resolve();
          };
          img.addEventListener?.("load", done);
          img.addEventListener?.("error", done);
          // Timeout so we never hang the UI
          window.setTimeout(done, 4000);
        }),
    ),
  ).then(() => {
    const ok = textures.some((tex) => {
      const image = tex.image as
        | HTMLImageElement
        | ImageBitmap
        | HTMLCanvasElement
        | undefined;
      if (!image) return false;
      if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
        return image.width > 1;
      }
      if (image instanceof HTMLCanvasElement) {
        // 1x1 canvas = HQ stub — reject
        return image.width > 1 && image.height > 1;
      }
      const el = image as HTMLImageElement;
      return (el.naturalWidth ?? el.width ?? 0) > 1;
    });
    return ok;
  });
}

function CapsuleModel({
  url,
  onReady,
}: {
  url: string;
  onReady?: (ready: boolean) => void;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);
  const [showClone, setShowClone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    prepareMaterials(scene);
    setShowClone(false);
    onReady?.(false);

    void waitForTextures(scene).then((ok) => {
      if (cancelled) return;
      prepareMaterials(scene);
      setShowClone(ok);
      onReady?.(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [scene, onReady]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.035;
  });

  if (!showClone) {
    return null;
  }

  return (
    <Bounds fit clip margin={1.35}>
      <Center>
        <group ref={ref}>
          <Clone object={scene} deep />
        </group>
      </Center>
    </Bounds>
  );
}

export default function CapsuleScene({
  glb,
  onReady,
}: {
  glb: string;
  onReady?: (ready: boolean) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.25, 2.6], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMappingExposure: 1.1,
      }}
      className="h-full w-full touch-none"
    >
      <color attach="background" args={["#0c0c0c"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 2]} intensity={1.45} />
      <directionalLight position={[-2.5, 1.5, -1]} intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#222222", 0.35]} />
      <Suspense fallback={null}>
        <CapsuleModel url={glb} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
