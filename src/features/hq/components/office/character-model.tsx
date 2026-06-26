"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import { SkeletonUtils } from "three-stdlib";
import { applySolidGltfMaterials } from "./apply-gltf-materials";
import { CHARACTER_HEIGHT, CHARACTER_YAW } from "./office-models";

/**
 * Renders a GLB character, auto-normalized: scaled to CHARACTER_HEIGHT, feet on
 * the floor (y=0), recentered on x/z. Each instance is an independent clone so
 * shared materials/skeletons don't conflict. Placement/rotation/animation are
 * handled by the parent group in `office-employee.tsx`.
 */
export function CharacterModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
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
