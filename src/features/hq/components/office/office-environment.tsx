"use client";

import { useGLTF } from "@react-three/drei";

/**
 * Renders a full headquarters environment from a single GLB (floor, walls,
 * furniture, signage). Use this when you have a baked office model instead of
 * the procedural rooms. Employees are still placed on top via the layout.
 */
export function OfficeEnvironment({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
