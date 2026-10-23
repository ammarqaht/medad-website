/* Small shared pieces of the Nabda demo: Arabic numbers, the pulse line. */
import type { Team } from './engine';

const AR = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits for display. */
export const ar = (n: number): string => String(n).replace(/\d/g, (d) => AR[Number(d)]);

/** Whole seconds left, rounded up (a clock showing zero has stopped). */
export const secs = (ms: number): number => Math.max(0, Math.ceil(ms / 1000 - 1e-6));

/** A number for display. Zero is a flat square outline: the Arabic-Indic zero
    is a lone dot and reads as a stray letter dot (DESIGN.md §8). */
export function Num({ n }: { n: number }) {
  return n === 0 ? <span class="nb-zero" role="img" aria-label="صفر"></span> : <>{ar(n)}</>;
}

export function secondsText(n: number): string {
  if (n === 0) return 'صفر';
  if (n === 1) return 'ثانية واحدة';
  if (n === 2) return 'ثانيتان';
  if (n <= 10) return `${ar(n)} ثوان`;
  return `${ar(n)} ثانية`;
}

export function pointsText(n: number): string {
  if (n === 0) return 'لا نقاط';
  if (n === 1) return 'نقطة واحدة';
  if (n === 2) return 'نقطتان';
  if (n <= 10) return `${ar(n)} نقاط`;
  return `${ar(n)} نقطة`;
}

/* One heartbeat in units: flat, a small bump, the sharp spike, a soft wave. */
const BEAT: [number, number][] = [
  [0, 0], [8, 0], [10, 0.14], [12, 0], [15, 0], [16, -0.22], [18, 1], [20, -0.4], [21, 0],
  [25, 0], [28, 0.26], [31, 0], [36, 0],
];
const PERIOD = 36;
const W = 144;
const H = 36;

/** Points of the pulse line. `beat` scrolls it toward the inline end (left). */
export function pulsePoints(strength: number, beat: number): string {
  const mid = H / 2;
  const amp = strength * (H / 2 - 3);
  if (amp <= 0) return `0,${mid} ${W},${mid}`;
  const shift = beat % PERIOD;
  const pts: string[] = [];
  for (let start = -PERIOD; start < W + PERIOD; start += PERIOD) {
    for (const [x, y] of BEAT) {
      const px = start + x + shift;
      pts.push(`${px.toFixed(1)},${(mid - y * amp).toFixed(1)}`);
    }
  }
  return pts.join(' ');
}

/** The ECG strip of one team. Decorative: the seconds next to it carry the value. */
export function Pulse({ team, strength, still }: { team: Team; strength: number; still: boolean }) {
  // reduced motion: no scroll, and the height changes in coarse steps only
  const s = still ? Math.ceil(strength * 5) / 5 : strength;
  return (
    <svg class="nb-pulse" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <polyline points={pulsePoints(s, still ? 6 : -team.beat)} vector-effect="non-scaling-stroke" />
    </svg>
  );
}
