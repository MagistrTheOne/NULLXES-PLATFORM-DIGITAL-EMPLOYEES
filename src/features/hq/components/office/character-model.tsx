"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import { SkeletonUtils } from "three-stdlib";
import {
  applySolidGltfMaterials,
  configureGltfLoaderNoTextures,
  ensureGltfTexturesAreStubbed,
} from "./apply-gltf-materials";
import { CHARACTER_HEIGHT, CHARACTER_YAW } from "./office-models";

// Run as early as this module is evaluated on the client.
ensureGltfTexturesAreStubbed();

/**
 * Renders a GLB character, auto-normalized: scaled to CHARACTER_HEIGHT, feet on
 * the floor (y=0), recentered on x/z. Each instance is an independent clone so
 * shared materials/skeletons don't conflict. Placement/rotation/animation are
 * handled by the parent group in `office-employee.tsx`.
 */
export function CharacterModel({ url }: { url: string }) {
  // Install a no-op texture loader for this asset load. Prevents the GLTFLoader
  // from creating/attempting blob: texture loads for embedded maps.
  const { scene } = useGLTF(url, undefined, undefined, configureGltfLoaderNoTextures);

  const { object, scale, offset } = useMemo(() => {
    // Extra safety: the prototype patch should already be active, but ensure here too.
    ensureGltfTexturesAreStubbed();

    // Strip any textures that may already exist on the cached source scene
    // (from previous loads or HMR). This + the loader patch stops repeated
    // "Couldn't load texture blob:..." errors.
    scene.traverse((node: any) => {
      if (node.isMesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat: any) => {
          const keys = [
            "map",
            "lightMap",
            "aoMap",
            "emissiveMap",
            "bumpMap",
            "normalMap",
            "displacementMap",
            "roughnessMap",
            "metalnessMap",
            "alphaMap",
            "envMap",
          ] as const;
          keys.forEach((k) => {
            if (mat[k]) {
              try {
                mat[k].dispose?.();
              } catch {}
              mat[k] = null;
            }
          });
          mat.needsUpdate = true;
        });
      }
    });

    const cloned = SkeletonUtils.clone(scene) as Object3D;
    applySolidGltfMaterials(cloned, { variant: "character" });
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const height = size.y || 1;
    const nextScale = CHARACTER_HEIGHT / height;
    // After scaling, recenter x/z on the origin and drop feet to y=0.
    const nextOffset: [number, number, number] = [
      -center.x * nextScale,
      -box.min.y * nextScale,
      -center.z * nextScale,
    ];
    return { object: cloned, scale: nextScale, offset: nextOffset };
  }, [scene]);

  return (
    <group rotation={[0, CHARACTER_YAW, 0]}>
      <group position={offset} scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}
