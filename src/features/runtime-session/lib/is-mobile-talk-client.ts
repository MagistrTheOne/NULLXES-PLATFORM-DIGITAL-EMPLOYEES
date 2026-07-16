/**
 * Coarse pointer / narrow viewport — used for Talk mic + camera constraints.
 * Prefer matchMedia over UA sniffing (iPadOS can report as desktop UA).
 */
export function isMobileTalkClient(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  } catch {
    return false;
  }
}
