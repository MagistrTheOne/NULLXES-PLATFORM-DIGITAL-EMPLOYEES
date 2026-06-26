import * as THREE from "three";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { GLTFLoader } from "three-stdlib";

/**
 * One-time guard so we don't patch the prototype on every HMR or re-import.
 */
let textureStubPatched = false;

function isHqModelTextureUrl(url: string): boolean {
  return (
    typeof url === "string" &&
    (url.startsWith("blob:") ||
      url.includes("/models/") ||
      url.includes("femalelow") ||
      url.includes("female_low_model") ||
      url.includes("male.glb") ||
      url.includes("60s_office"))
  );
}

/**
 * Patch TextureLoader + ImageLoader at the prototype level as early as possible.
 *
 * GLTFLoader (and drei's useGLTF) create many loader instances for embedded
 * textures. Some code paths in GLTFLoader go through TextureLoader, others
 * through ImageLoader (especially for bufferView images turned into blob: URLs).
 *
 * We stub both so that "Couldn't load texture blob:..." never fires for our
 * HQ office models. All other texture loads in the app are untouched.
 */
export function ensureGltfTexturesAreStubbed(): void {
  if (typeof window === "undefined" || textureStubPatched) return;
  textureStubPatched = true;

  // --- TextureLoader ---
  const texProto = THREE.TextureLoader.prototype as any;
  const originalTexLoad = texProto.load as Function;

  texProto.load = function patchedTextureLoad(
    this: any,
    url: string,
    onLoad?: (texture: THREE.Texture) => void,
    onProgress?: any,
    onError?: (error: unknown) => void,
  ) {
    if (isHqModelTextureUrl(url)) {
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

        Promise.resolve().then(() => onLoad?.(texture));
        return texture;
      } catch (err) {
        if (onError) onError(err);
        return originalTexLoad.call(this, url, onLoad, onProgress, onError);
      }
    }
    return originalTexLoad.call(this, url, onLoad, onProgress, onError);
  };

  // --- ImageLoader (critical for many embedded GLB textures) ---
  // GLTFLoader often does: new ImageLoader(manager).load(blobUrl, onImage, ...)
  // and logs the "Couldn't load texture" error from its own onError wrapper.
  const imgProto = (THREE as any).ImageLoader?.prototype as any;
  if (imgProto && typeof imgProto.load === "function") {
    const originalImgLoad = imgProto.load as Function;

    imgProto.load = function patchedImageLoad(
      this: any,
      url: string,
      onLoad?: (image: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => void,
      onProgress?: any,
      onError?: (error: unknown) => void,
    ) {
      if (isHqModelTextureUrl(url)) {
        try {
          // Provide a minimal valid image so GLTFLoader can proceed without error.
          const img = new Image();
          // 1x1 black PNG data URL (immediately "loaded")
          img.src =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
          img.width = 1;
          img.height = 1;

          Promise.resolve().then(() => onLoad?.(img));
          return img;
        } catch (err) {
          if (onError) onError(err);
          return originalImgLoad.call(this, url, onLoad, onProgress, onError);
        }
      }
      return originalImgLoad.call(this, url, onLoad, onProgress, onError);
    };
  }
}

// Apply the patch as soon as this module is evaluated on the client.
// This is critical because model components can trigger loads during their first render.
ensureGltfTexturesAreStubbed();

// Character palette - slightly lifted from pure black so figures read in the scene
// while staying strictly in the black/white/gray language.
const CHARACTER_BODY = "#2a2a2a";   // main clothing / body
const CHARACTER_HEAD = "#c8b8a8";   // soft neutral for skin / face
const CHARACTER_HAIR = "#1c1c1c";   // hair / dark accents
const PROP_SURFACE = "#3a3a3a";

function solidMaterial(color: string): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.06,
  });
}

function isHeadMesh(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    normalized.includes("head") ||
    normalized.includes("face") ||
    normalized.includes("skin") ||
    normalized.includes("eye") ||
    normalized.includes("mouth") ||
    normalized.includes("neck") ||
    normalized.includes("brow")
  );
}

function isHairMesh(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes("hair");
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

    let color = CHARACTER_BODY;

    if (variant === "prop") {
      color = PROP_SURFACE;
    } else if (isHairMesh(node.name)) {
      color = CHARACTER_HAIR;
    } else if (isHeadMesh(node.name)) {
      color = CHARACTER_HEAD;
    }

    const mat = solidMaterial(color);

    // Softer, more readable shading for characters (higher roughness = less mirror-like black)
    if (variant === "character") {
      mat.roughness = 0.82;
      mat.metalness = 0.04;
    }

    node.material = mat;
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

  // Stub the TextureLoader attached to this GLTFLoader instance (if any).
  const texLoader = (loader as any).textureLoader;
  if (texLoader && typeof texLoader.load === "function") {
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

        Promise.resolve().then(() => onLoad?.(texture));
        return texture;
      } catch (err) {
        if (onError) onError(err);
        return originalLoad(_url, onLoad, _onProgress, onError);
      }
    };
  }

  // Best-effort: some GLTFLoader setups also keep an ImageLoader reference.
  const imgLoader = (loader as any).imageLoader;
  if (imgLoader && typeof imgLoader.load === "function") {
    const originalImgLoad = imgLoader.load.bind(imgLoader);

    imgLoader.load = (
      _url: string,
      onLoad?: (image: any) => void,
      _onProgress?: any,
      onError?: (error: unknown) => void,
    ) => {
      if (isHqModelTextureUrl(_url)) {
        try {
          const img = new Image();
          img.src =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
          img.width = 1;
          img.height = 1;
          Promise.resolve().then(() => onLoad?.(img));
          return img;
        } catch (err) {
          if (onError) onError(err);
          return originalImgLoad(_url, onLoad, _onProgress, onError);
        }
      }
      return originalImgLoad(_url, onLoad, _onProgress, onError);
    };
  }
}
