/**
 * 3D assets for the headquarters scene.
 *
 * Models live in `public/models/` (currently gitignored during iteration).
 * Female character updated to the provided low-poly girl model for Somnia
 * (and other female employees). Textures + final materials will be integrated
 * when the full office concept (walls, props, etc.) is assembled.
 *
 * Characters are auto-normalized at runtime (scaled to CHARACTER_HEIGHT, feet
 * on the floor, recentered) so source scale/origin don't matter. CHARACTER_YAW
 * corrects facing if a model walks backwards.
 */
export const HQ_MODELS: {
  characters: { female: string | null; male: string | null };
  props: string | null;
} = {
  characters: {
    // Female base model with textures (for Somnia + other female employees).
    // Path: public/models/female_base.glb
    // Used for characters resolved as "female".
    //
    // The model is now committed (removed from .gitignore) so it deploys to Vercel.
    // If the GLB fails to load at runtime (rare network/asset issue), we gracefully
    // fall back to the styled primitive character via error boundary.
    female: "/models/female_base.glb",

    // Male model is still optional / dev-only for now.
    male:
      process.env.NODE_ENV === "development" ? "/models/male.glb" : null,
  },
  props:
    process.env.NODE_ENV === "development"
      ? "/models/60s_office_props.glb"
      : null,
};

/** Target world height for character models (scene unit ≈ 1m-ish). */
export const CHARACTER_HEIGHT = 1.05;

/** Facing correction in radians (flip to Math.PI if models face backwards). */
export const CHARACTER_YAW = 0;

/**
 * Rest-pose correction on the GLB group [pitch, yaw, roll].
 * Use a tiny negative roll if a source mesh leans left in T-pose.
 */
export const CHARACTER_POSE_CORRECT: [number, number, number] = [0, 0, 0];

/** Whether any character GLB is configured (enables model rendering). */
export const HAS_CHARACTER_MODELS =
  HQ_MODELS.characters.female !== null || HQ_MODELS.characters.male !== null;

/**
 * Placement for the furnished props scene (one furnished area). It's a whole
 * furnished room (~8x12u), so it's dropped into the open central atrium by
 * default — tune position/fit/yaw here once you see it on the floor.
 */
export const PROPS_PLACEMENT = {
  /** Center on the floor. */
  position: [0, 0, 0.5] as [number, number, number],
  /** Uniform scale applied after normalization. */
  scale: 1,
  /** Footprint the normalized props are fit into (X/Z), in scene units. */
  fit: 6,
  /** Yaw in radians. */
  yaw: 0,
};

import {
  resolveCharacterGender,
  type CharacterGender,
} from "../../lib/resolve-character-gender";

/**
 * Pick the character model for an employee by resolved gender, so the female
 * body attaches to female employees (Somnia, Kira, …) and the male body to the
 * rest. Falls back to whichever model is configured.
 */
export function pickCharacterModel(name: string): string | null {
  const { female, male } = HQ_MODELS.characters;
  if (!female && !male) {
    return null;
  }
  const gender: CharacterGender = resolveCharacterGender(name);
  if (gender === "female") {
    return female ?? male;
  }
  return male ?? female;
}
