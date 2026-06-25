"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Object3D } from "three";
import { PROPS_PLACEMENT } from "./office-models";

/**
 * Renders the furnished props scene as one configurable area: normalized so its
 * footprint fits PROPS_PLACEMENT.fit, sitting on the floor, centered at the
 * configured position. Tweak PROPS_PLACEMENT to move/scale it.
 */
export function OfficeProps({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    const root = scene as Object3D;
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
