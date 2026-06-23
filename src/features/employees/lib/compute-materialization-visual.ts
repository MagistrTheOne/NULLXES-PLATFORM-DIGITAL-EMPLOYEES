export function computeMaterializationVisual(progress: number): {
  blurPx: number;
  opacity: number;
  scale: number;
} {
  const clamped = Math.max(0, Math.min(100, progress));

  return {
    blurPx: Math.max(0, 22 - clamped * 0.22),
    opacity: 0.28 + clamped * 0.0072,
    scale: 1.05 - clamped * 0.0005,
  };
}
