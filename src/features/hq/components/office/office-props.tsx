"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import {
  applySolidGltfMaterials,
  configureGltfLoaderNoTextures,
  ensureGltfTexturesAreStubbed,
} from "./apply-gltf-materials";
import { HQ_MODELS, PROPS_PLACEMENT } from "./office-models";

// Run as early as this module is evaluated on the client.
ensureGltfTexturesAreStubbed();

/**
 * Renders the furnished props scene as one configurable area: normalized so its
 * footprint fits PROPS_PLACEMENT.fit, sitting on the floor, centered at the
 * configured position. Tweak PROPS_PLACEMENT to move/scale it.
 */
export function OfficeProps({ url }: { url: string }) {
  // Same no-texture patch as characters so props GLB doesn't emit blob errors.
  const { scene } = useGLTF(url, undefined, undefined, configureGltfLoaderNoTextures);

  const { object, scale, offset } = useMemo(() => {
    // Extra safety: the prototype patch should already be active.
    ensureGltfTexturesAreStubbed();

    // Clear textures on the cached source to avoid repeated load failures.
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

    const root = scene.clone(true) as Object3D;
    applySolidGltfMaterials(root, { variant: "prop" });
    const box = new Box3().setFromObject(root);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const footprint = Math.max(size.x, size.z) || 1;
    const fitScale = (PROPS_PLACEMENT.fit / footprint) * PROPS_PLACEMENT.scale;
    const nextOffset: [number, number, number] = [
      -center.x * fitScale,
      -box.min.y * fitScale,
      -center.z * fitScale,
    ];
    return { object: root, scale: fitScale, offset: nextOffset };
  }, [scene]);

  return (
    <group
      position={PROPS_PLACEMENT.position}
      rotation={[0, PROPS_PLACEMENT.yaw, 0]}
    >
      <group position={offset} scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}
