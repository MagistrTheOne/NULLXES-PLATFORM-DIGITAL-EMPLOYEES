"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { Object3D } from "three";

/**
 * Renders a GLB character. Each employee gets an independent clone so skinned
 * meshes/animations don't share state. The wrapping <group> handles placement,
 * rotation and walk animation in `office-employee.tsx`.
 */
export function CharacterModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => SkeletonUtils.clone(scene) as Object3D, [scene]);
  return <primitive object={cloned} />;
}
