import { Mesh, MeshStandardMaterial, type Object3D } from "three";

const CHARACTER_BODY = "#161616";
const CHARACTER_HEAD = "#d4d4d4";
const PROP_SURFACE = "#3a3a3a";

function solidMaterial(color: string): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.08,
  });
}

function isHeadMesh(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    normalized.includes("head") ||
    normalized.includes("face") ||
    normalized.includes("skin") ||
    normalized.includes("hair")
  );
}

/**
 * Replace GLB PBR materials (and their blob: texture URLs) with solid colors.
 * Embedded GLB textures often fail under Next.js HMR and SkeletonUtils.clone;
 * solid materials match the NULLXES floor palette and avoid loader errors.
 */
export function applySolidGltfMaterials(
  root: Object3D,
  options?: { variant?: "character" | "prop" },
): void {
  const variant = options?.variant ?? "character";

  root.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    const color =
      variant === "prop"
        ? PROP_SURFACE
        : isHeadMesh(node.name)
          ? CHARACTER_HEAD
          : CHARACTER_BODY;

    node.material = solidMaterial(color);
    node.castShadow = true;

    if (variant === "prop") {
      node.receiveShadow = true;
    }
  });
}
