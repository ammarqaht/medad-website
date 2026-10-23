/* Stop-motion timing: every animation runs at 12 frames per second, so motion
   reads as hand-drawn frames instead of smooth tweens (DESIGN.md §7). */
export const FPS = 12;

/** Number of frames a duration (seconds) gets at 12fps, never less than one. */
export function frames(seconds: number): number {
  return Math.max(1, Math.round(seconds * FPS));
}

/** GSAP ease string for a stepped animation of the given duration. */
export function stepEase(seconds: number): string {
  return `steps(${frames(seconds)})`;
}

/** CSS timing function for the same rhythm. */
export function stepCss(seconds: number): string {
  return `${Math.round(seconds * 1000)}ms steps(${frames(seconds)}, jump-end)`;
}
