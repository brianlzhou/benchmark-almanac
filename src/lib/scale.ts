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

export const round = (v: number, p = 1) => Math.round(v * 10 ** p) / 10 ** p;
