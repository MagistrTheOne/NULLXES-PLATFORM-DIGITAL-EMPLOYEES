import * as THREE from "three";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { GLTFLoader } from "three-stdlib";

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

/**
 * Configures a GLTFLoader (used by drei's useGLTF / preload) so that it never
 * attempts to load real texture images. It supplies a 1x1 solid CanvasTexture
 * instead. This completely avoids "Couldn't load texture blob:..." errors for
 * the HQ office models.
 *
 * We still call applySolidGltfMaterials afterwards to set the proper monochrome
 * PBR look that matches the app's black/white design.
 */
export function configureGltfLoaderNoTextures(loader: GLTFLoader): void {
  const texLoader = (loader as any).textureLoader;
  if (!texLoader || typeof texLoader.load !== "function") {
    return;
  }

  const originalLoad = texLoader.load.bind(texLoader);

  texLoader.load = (
    _url: string,
    onLoad?: (texture: THREE.Texture) => void,
    _onProgress?: any,
    onError?: (error: unknown) => void,
  ) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#222222";
        ctx.fillRect(0, 0, 1, 1);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      onLoad?.(texture);
      return texture;
    } catch (err) {
      // Extremely unlikely fallback
      if (onError) onError(err);
      // Try the original as last resort (will likely fail the same way)
      return originalLoad(_url, onLoad, _onProgress, onError);
    }
  };
}
