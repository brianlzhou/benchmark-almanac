// Small scale helpers for charts drawn at build time.

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** Round tick values for a numeric axis. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (max <= min) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

export function niceMax(max: number): number {
  const t = niceTicks(0, max, 5);
  return t.at(-1)! < max ? t.at(-1)! + (t[1] - t[0]) : t.at(-1)!;
}

/** Where bars for a rating start: a round number a little below the lowest rating. A rating has no true zero. */
export function ratingFloor(values: number[]): number {
  const least = Math.min(...values);
  const top = Math.max(...values);
  const t = niceTicks(least, top, 5);
  const step = t.length > 1 ? t[1] - t[0] : Math.max(1, least * 0.05);
  let lo = Math.floor(least / step) * step;
  if (lo >= least) lo -= step;
  return Math.max(0, lo);
}

/** Year ticks for a time axis given as decimal years. */
export function yearTicks(min: number, max: number, maxTicks = 8): number[] {
  const first = Math.ceil(min);
  const last = Math.floor(max);
  const span = last - first + 1;
  const step = Math.max(1, Math.ceil(span / maxTicks));
  const out: number[] = [];
  for (let y = first; y <= last; y += step) out.push(y);
  return out;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Ticks for a time axis given in fractional years. Spans of two years or more get year ticks. Shorter
 * spans get month ticks every 1, 2, 3 or 6 months, with the year on January and on the first tick.
 */
export function timeTicks(min: number, max: number, maxTicks = 8): { date: string; label: string }[] {
  if (max - min >= 2) return yearTicks(min, max, maxTicks).map((y) => ({ date: `${y}-01-01`, label: String(y) }));
  const m0 = Math.ceil(min * 12 - 1e-9);
  const m1 = Math.floor(max * 12);
  const step = [1, 2, 3, 6].find((s) => (m1 - m0) / s + 1 <= maxTicks) ?? 12;
  const out: { date: string; label: string }[] = [];
  for (let m = Math.ceil(m0 / step) * step; m <= m1; m += step) {
    const y = Math.floor(m / 12);
    const mo = m - y * 12;
    out.push({ date: `${y}-${String(mo + 1).padStart(2, '0')}-01`, label: mo === 0 || !out.length ? `${MON[mo]} ${y}` : MON[mo] });
  }
  return out;
}

export const round = (v: number, p = 1) => Math.round(v * 10 ** p) / 10 ** p;

/** Year gridlines for an HTML chart: a CSS background with one hairline per year at the given positions. */
export function yearLines(positions: string[], color = 'var(--grid)'): string {
  return positions.map((p) => `linear-gradient(${color}, ${color}) ${p} 0 / 1px 100% no-repeat`).join(', ');
}
