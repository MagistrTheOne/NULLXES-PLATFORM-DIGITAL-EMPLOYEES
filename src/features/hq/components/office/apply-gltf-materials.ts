import * as THREE from "three";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { GLTFLoader } from "three-stdlib";

/**
 * One-time guard so we don't patch the prototype on every HMR or re-import.
 */
let textureStubPatched = false;

/**
 * Patch TextureLoader at the prototype level as early as possible.
 * This is the most reliable way to kill "Couldn't load texture blob:..." errors
 * because GLTFLoader (and drei's wrappers) create many TextureLoader instances,
 * and some loads for embedded GLB images can bypass per-instance patches.
 *
 * We only stub loads that look like they come from our office GLBs (blob: or /models/).
 * All other texture loads in the app are left untouched.
 */
export function ensureGltfTexturesAreStubbed(): void {
  if (typeof window === "undefined" || textureStubPatched) return;
  textureStubPatched = true;

  const proto = THREE.TextureLoader.prototype as any;
  const originalLoad = proto.load as Function;

  proto.load = function patchedTextureLoad(
    this: any,
    url: string,
    onLoad?: (texture: THREE.Texture) => void,
    onProgress?: any,
    onError?: (error: unknown) => void,
  ) {
    const isSuspicious =
      typeof url === "string" &&
      (url.startsWith("blob:") ||
        url.includes("/models/") ||
        url.includes("femalelow") ||
        url.includes("male.glb") ||
        url.includes("60s_office"));

    if (isSuspicious) {
      // Return a tiny solid canvas texture instead of trying to fetch the real one.
      // This prevents the GLTFLoader internal "Couldn't load texture blob:..." errors.
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

        // Mimic async load so consumers that expect a promise-like behavior are happy.
        Promise.resolve().then(() => onLoad?.(texture));
        return texture;
      } catch (err) {
        // Last resort: let the original run (it will probably log the same error).
        if (onError) onError(err);
        return originalLoad.call(this, url, onLoad, onProgress, onError);
      }
    }

    // Normal path for everything else.
    return originalLoad.call(this, url, onLoad, onProgress, onError);
  };
}

// Apply the patch as soon as this module is evaluated on the client.
// This is critical because model components can trigger loads during their first render.
ensureGltfTexturesAreStubbed();

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
  // Make sure the global safety net is active even if this per-loader path is used.
  ensureGltfTexturesAreStubbed();

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
