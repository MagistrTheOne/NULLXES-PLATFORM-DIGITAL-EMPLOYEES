/**
 * Optional 3D assets for the headquarters scene.
 *
 * Drop GLB files into `public/models/` and set the paths below to swap the
 * procedural geometry for real models:
 *   - `office`    → a full floor environment (replaces procedural rooms/floor)
 *   - `character` → a single employee model (replaces the procedural figure)
 *
 * Format: glTF binary (.glb), Y-up, meters, origin at the feet for characters.
 * Keep them low-poly (see README guidance). Leave `null` to use procedural.
 */
export const HQ_MODEL_PATHS: {
  office: string | null;
  character: string | null;
} = {
  office: null,
  character: null,
};
