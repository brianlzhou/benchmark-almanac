// The landscape across the top of the footer: benchmarks released each month since 2019, stacked by area, so
// the colours show which kinds of test each year brought. The outline's height is the square root of the
// month's total, so the quiet early years still show as terrain. Within it, each area's band is its share of
// that month. Each outline is a static SVG (src/pages/ridge/[shape].svg.ts) that the footer uses as a CSS
// mask, so the shapes stretch to any screen width while the stipple inside them keeps round dots.
import { benchmarks, AS_OF } from './data.ts';
import { AREAS, areaOf } from './taxonomy.ts';

export const W = 1440;
export const H = 132;
const START = 2019;

/** Bottom to top, in the palette's order. */
export const LAYERS = AREAS.map((a) => a.id);

// whole months only: the month in progress would show as a false drop at the right edge
function monthsSince() {
  const [ey, em] = AS_OF.split('-').map(Number);
  const out: string[] = [];
  for (let y = START; y <= ey; y++) for (let m = 1; m <= 12; m++) if (y < ey || m < em) out.push(`${y}-${String(m).padStart(2, '0')}`);
  return out;
}

// a soft hill, not a bar chart: each month averages with its neighbours
function smooth(raw: number[]) {
  const K = [1, 2, 3, 4, 3, 2, 1];
  return raw.map((_, i) => {
    let s = 0;
    let w = 0;
    K.forEach((k, j) => {
      const v = raw[i + j - 3];
      if (v !== undefined) {
        s += v * k;
        w += k;
      }
    });
    return s / w;
  });
}

let cache: Map<string, string> | undefined;

/** For each area, the outline of it and every area below it, as SVG path data in a W by H box. */
export function ridgePaths() {
  if (cache) return cache;
  const months = monthsSince();
  const at = new Map(months.map((m, i) => [m, i]));
  const raw = new Map(LAYERS.map((id) => [id, months.map(() => 0)]));
  for (const b of benchmarks) {
    const i = at.get(b.released?.slice(0, 7) ?? '');
    if (i !== undefined) raw.get(areaOf(b.category))![i]++;
  }
  const bands = LAYERS.map((id) => smooth(raw.get(id)!));
  const total = months.map((_, i) => bands.reduce((s, b) => s + b[i], 0));
  const top = Math.max(...total);
  const height = total.map((t) => Math.sqrt(t / top) * (H - 24));
  const x = (i: number) => (i / (months.length - 1)) * W;
  const f = (n: number) => n.toFixed(1);
  const outline = (ys: number[]) => {
    let d = `M0 ${H}L0 ${f(ys[0])}`;
    for (let i = 1; i < ys.length; i++) {
      const m = (x(i - 1) + x(i)) / 2;
      d += `C${f(m)} ${f(ys[i - 1])} ${f(m)} ${f(ys[i])} ${f(x(i))} ${f(ys[i])}`;
    }
    return `${d}L${W} ${H}Z`;
  };
  cache = new Map();
  const below = months.map(() => 0);
  LAYERS.forEach((id, k) => {
    bands[k].forEach((v, i) => (below[i] += v));
    // 6px of ground under every band, so the baseline never shows through
    cache!.set(id, outline(below.map((c, i) => H - 6 - (total[i] ? (c / total[i]) * height[i] : 0))));
  });
  return cache;
}

/** A 28px tile of dots scattered by a fixed rule, so the texture looks hand-stippled but builds the same every time. */
export function dotTile(n: number, seed: number) {
  const size = 28;
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const dots = Array.from({ length: n }, () => `<circle cx="${(r() * size).toFixed(1)}" cy="${(r() * size).toFixed(1)}" r="${(0.45 + r() * 0.6).toFixed(2)}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${dots.join('')}</svg>`;
}
