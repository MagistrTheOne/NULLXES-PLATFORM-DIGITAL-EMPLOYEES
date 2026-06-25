/**
 * 3D assets for the headquarters scene. Drop GLB files into `public/models/`.
 * Characters are auto-normalized at runtime (scaled to CHARACTER_HEIGHT, feet
 * on the floor, recentered) so source scale/origin don't matter. CHARACTER_YAW
 * corrects facing if a model walks backwards.
 */
export const HQ_MODELS: {
  characters: { female: string | null; male: string | null };
  props: string | null;
} = {
  characters: {
    female: "/models/femalelow.glb",
    male: "/models/male.glb",
  },
  props: "/models/60s_office_props.glb",
};

/** Target world height for character models (scene unit ≈ 1m-ish). */
export const CHARACTER_HEIGHT = 1.05;

/** Facing correction in radians (flip to Math.PI if models face backwards). */
export const CHARACTER_YAW = 0;

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

/**
 * Deterministically assign a character model to an employee so the same person
 * always renders with the same body (skins can override this later).
 */
export function pickCharacterModel(employeeId: string): string | null {
  const { female, male } = HQ_MODELS.characters;
  if (!female && !male) {
    return null;
  }
  if (!female) {
    return male;
  }
  if (!male) {
    return female;
  }
  let hash = 0;
  for (let i = 0; i < employeeId.length; i += 1) {
    hash = (hash * 31 + employeeId.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? female : male;
}
