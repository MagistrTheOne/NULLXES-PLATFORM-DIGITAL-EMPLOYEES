"use client";

import { useEffect, useMemo, useState } from "react";
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
 *
 * If the GLB fails to load (e.g. 404 on prod because models are gitignored),
 * we render nothing here — the caller (OfficeEmployee) falls back to a solid
 * primitive character so the scene never breaks.
 */
export function CharacterModel({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);

  // If no model configured (prod, or explicitly disabled), render nothing.
  // The parent OfficeEmployee renders a fully-featured primitive character instead.
  if (!url) {
    return null;
  }

  // Hook is now called unconditionally for any mount that has a truthy url.
  const { scene: loadedScene } = useGLTF(
    url,
    undefined,
    undefined,
    configureGltfLoaderNoTextures,
  );

  useEffect(() => {
    // Best-effort: mark as failed if we see related errors (404s etc.).
    // useGLTF errors are often surfaced via Suspense boundaries; this helps
    // in some direct error cases.
    const onError = (e: any) => {
      const msg = String(e?.message || e?.reason || "");
      if (msg.includes(url) || (e?.target?.src || "").includes(url)) {
        setFailed(true);
      }
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, [url]);

  const scene = failed ? null : loadedScene;

  // If the load failed (or returned no scene), render nothing.
  // Parent will show the solid primitive character.
  if (!scene) {
    return null;
  }

  const { object, scale, offset } = useMemo(() => {
    // Extra safety: the prototype patch should already be active, but ensure here too.
    ensureGltfTexturesAreStubbed();

    // For older models we aggressively strip textures to avoid blob/CSP issues.
    // For the new female_base (with good textures) we preserve them.
    if (!url.includes("female_base")) {
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
    }

    const cloned = SkeletonUtils.clone(scene) as Object3D;

    // For the new textured female_base model, we want to keep its materials/textures.
    // For other (older) models we continue to force solid colors.
    if (!url.includes("female_base")) {
      applySolidGltfMaterials(cloned, { variant: "character" });
    }
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const height = size.y || 1;
    const nextScale = CHARACTER_HEIGHT / height;

    // After scaling, recenter x/z and put feet on y=0.
    // Some models (especially the textured female) have geometry slightly below the visual sole
    // or different rest pose. We add a tiny positive bias for female_base so feet sit on the floor.
    const feetBias = url.includes("female_base") ? 0.07 : 0.04;
    const nextOffset: [number, number, number] = [
      -center.x * nextScale,
      -box.min.y * nextScale + feetBias,
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
