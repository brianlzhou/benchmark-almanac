// The model-card area chart, drawn as an SVG string so the build and the browser share one renderer. The
// build draws the default view (each area's share, all areas). The browser redraws it when a reader switches
// between share and count, or opens an area to see its categories and a category to see its subcategories.
// This file imports nothing that carries data, so the browser bundle stays small.
import { linear, niceTicks } from './scale.ts';

/** One level of the taxonomy. Leaves carry counts per half year, and a parent's counts are its children's sum. */
export interface ShareNode {
  id: string;
  n: string;
  c?: ShareNode[];
  v?: number[];
}

export interface ShareData {
  /** Half years, oldest first, with no gaps: "2024-H1". */
  b: string[];
  /** How much of the last half year has passed, from 0 to 1. */
  f: number;
  /** The date the data runs through, for the partial half year: "November 10". */
  asOf: string;
  root: ShareNode;
}

export type ShareMode = 'share' | 'count';

export interface ShareSize {
  key: string;
  w: number;
  h: number;
  font: number;
  label: boolean;
}

const PAD = { l: 46, r: 150, t: 8, b: 30 };

/** The desktop and phone renders for a chart of the given height. */
export function sizesFor(height: number): ShareSize[] {
  return [
    { key: 'wide', w: 1120, h: height, font: 12.5, label: true },
    { key: 'narrow', w: 380, h: Math.round(height * 0.75), font: 11, label: false },
  ];
}

export function values(node: ShareNode, nb: number): number[] {
  if (node.v) return node.v;
  const out = new Array(nb).fill(0);
  for (const c of node.c ?? []) values(c, nb).forEach((v, i) => (out[i] += v));
  node.v = out;
  return out;
}

export function nodeAt(root: ShareNode, path: string[]): ShareNode {
  let node = root;
  for (const id of path) node = node.c?.find((c) => c.id === id) ?? node;
  return node;
}

/**
 * Where a click on this node leads: it skips levels with a single child, so opening an area with one
 * category goes straight to that category's subcategories. Null when there is nothing to break down.
 */
export function opens(node: ShareNode): string[] | null {
  const path: string[] = [];
  let at = node;
  while (at.c?.length === 1 && at.c[0].c?.length) {
    at = at.c[0];
    path.push(at.id);
  }
  return (at.c?.length ?? 0) >= 2 ? path : null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A child's fill: an area's own color at the top level, and shades of that color inside an area. */
export function fillOf(path: string[], i: number, k: number, id: string): { fill: string; opacity: number } {
  if (!path.length) return { fill: `var(--area-${id})`, opacity: 1 };
  return { fill: `var(--area-${path[0]})`, opacity: k > 1 ? Math.round((1 - (i * 0.68) / (k - 1)) * 100) / 100 : 1 };
}

export function periodName(data: ShareData, i: number): string {
  const k = data.b[i];
  const base = `${k.slice(0, 4)}, ${k.endsWith('H1') ? 'first half' : 'second half'}`;
  return i === data.b.length - 1 && data.f < 1 ? `${base}, through ${data.asOf}` : base;
}

export function levelName(data: ShareData, path: string[]): string {
  if (!path.length) return 'area';
  return path.length === 1 ? 'category' : 'subcategory';
}

/**
 * Stacked areas over time. The x axis is time: each half year spans its own six months, its point sits in
 * its middle, and each year's label sits on January 1. The last half year is as wide as the time that has
 * passed in it. In share mode a half year with no posts is left out and the bands join across it.
 */
export function renderShare(data: ShareData, mode: ShareMode, path: string[], size: ShareSize): string {
  const { w, h, font, label } = size;
  const nb = data.b.length;
  const node = nodeAt(data.root, path);
  const kids = node.c ?? [];
  const series = kids.map((c) => values(c, nb));
  const totals = data.b.map((_, i) => series.reduce((s, v) => s + v[i], 0));
  const end = nb - 1 + data.f;
  const mid = (i: number) => (i === nb - 1 ? i + data.f / 2 : i + 0.5);
  const right = label ? PAD.r : 12;
  const x = linear([0, end], [PAD.l, w - right]);
  const top = mode === 'share' ? 1 : Math.max(1, niceTicks(0, Math.max(1, ...totals), 4).at(-1)!);
  const y = linear([0, top], [h - PAD.b, PAD.t]);
  const ticks = mode === 'share' ? [0, 0.25, 0.5, 0.75, 1] : niceTicks(0, top, 4);
  const tickText = (v: number) => (mode === 'share' ? `${Math.round(v * 100)}%` : v.toLocaleString('en-US'));

  // the buckets drawn, and the x positions of the points: each bucket's middle, plus flat ends at the edges
  const drawn = data.b.map((_, i) => i).filter((i) => mode === 'count' || totals[i] > 0);
  const first = drawn[0];
  const last = drawn.at(-1);
  const out: string[] = [];
  const aria = `${mode === 'share' ? 'Share' : 'Number'} of headline benchmarks in launch posts by ${levelName(data, path)}, by half year`;
  out.push(`<svg class="only-${size.key}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(aria)}" style="--f:${font}px">`);
  for (const v of ticks) out.push(`<text x="${PAD.l - 12}" y="${r1(y(v) + 4)}" class="tick" text-anchor="end">${tickText(v)}</text>`);
  if (first !== undefined && last !== undefined) {
    const xs = [first, ...drawn.map(mid), last === nb - 1 ? end : last + 1].map((v) => r1(x(v)));
    const at = (k: number, i: number) => (mode === 'share' ? (totals[i] ? series[k][i] / totals[i] : 0) : series[k][i]);
    const pts = (k: number) => [first, ...drawn, last].map((i) => at(k, i));
    let lo = pts(0).map(() => 0);
    kids.forEach((c, k) => {
      const v = pts(k);
      const hi = lo.map((p, j) => p + v[j]);
      const upper = hi.map((p, j) => `${xs[j]},${r1(y(p))}`).join(' L');
      const lower = lo.map((p, j) => `${xs[j]},${r1(y(p))}`).reverse().join(' L');
      const { fill, opacity } = fillOf(path, k, kids.length, c.id);
      out.push(`<path d="M${upper} L${lower} Z" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''} class="layer"/>`);
      lo = hi;
    });
    // direct labels at the right edge, where a band is tall enough to hold one
    if (label) {
      let base = 0;
      const j = xs.length - 1;
      kids.forEach((c, k) => {
        const v = pts(k)[j];
        const thick = Math.abs(y(base) - y(base + v));
        if (thick >= 16) out.push(`<text x="${r1(xs[j] + 10)}" y="${r1((y(base) + y(base + v)) / 2 + 4)}" class="end">${esc(c.n)}</text>`);
        base += v;
      });
    }
  }
  out.push(`<line x1="${PAD.l - 4}" x2="${r1(x(end))}" y1="${r1(y(0))}" y2="${r1(y(0))}" class="axis"/>`);
  out.push(`<line x1="${PAD.l - 4}" x2="${PAD.l - 4}" y1="${r1(y(top))}" y2="${r1(y(0))}" class="axis"/>`);
  for (const v of ticks) out.push(`<line x1="${PAD.l - 8}" x2="${PAD.l - 4}" y1="${r1(y(v))}" y2="${r1(y(v))}" class="axis"/>`);
  // each year's label sits on its January 1
  data.b.forEach((k, i) => {
    if (!k.endsWith('H1')) return;
    const at = r1(x(i));
    out.push(`<line x1="${at}" x2="${at}" y1="${r1(y(0))}" y2="${r1(y(0) + 5)}" class="axis"/>`);
    out.push(`<text x="${at}" y="${h - 8}" class="tick" text-anchor="middle">${k.slice(0, 4)}</text>`);
  });
  // one hover column per half year, across its own span
  const can = kids.map((c) => !!opens(c));
  data.b.forEach((_, i) => {
    const x0 = r1(x(i));
    const x1 = r1(x(Math.min(i + 1, end)));
    const parts = kids
      .map((c, k) => ({ n: c.n, v: series[k][i] }))
      .filter((z) => z.v > 0 && (mode === 'count' || z.v / (totals[i] || 1) >= 0.01))
      .sort((p, q) => q.v - p.v)
      .map((z) => (mode === 'share' ? `${z.n} ${Math.round((z.v / totals[i]) * 100)}%` : `${z.n} ${z.v}`));
    const tv = `${totals[i].toLocaleString('en-US')} benchmark ${totals[i] === 1 ? 'mention' : 'mentions'}`;
    out.push(
      `<rect x="${x0}" y="${PAD.t}" width="${r1(x1 - x0)}" height="${h - PAD.t - PAD.b}" class="hit${can.some(Boolean) ? ' go' : ''}" data-j="${i}" data-tv="${esc(tv)}" data-tn="${esc(periodName(data, i))}" data-ts="${esc(parts.join('. '))}"/>`,
    );
  });
  out.push('</svg>');
  return out.join('');
}

/**
 * Which child a point on the chart falls in, for a click: the child whose band holds the given y at half
 * year i. Null above the top band or when the half year is empty.
 */
export function childAt(data: ShareData, mode: ShareMode, path: string[], size: ShareSize, i: number, py: number): ShareNode | null {
  const nb = data.b.length;
  const kids = nodeAt(data.root, path).c ?? [];
  const series = kids.map((c) => values(c, nb));
  const total = series.reduce((s, v) => s + v[i], 0);
  if (!total) return null;
  const totals = data.b.map((_, j) => series.reduce((s, v) => s + v[j], 0));
  const top = mode === 'share' ? 1 : Math.max(1, niceTicks(0, Math.max(1, ...totals), 4).at(-1)!);
  const value = linear([size.h - PAD.b, PAD.t], [0, top])(py);
  let base = 0;
  for (const [k, c] of kids.entries()) {
    const v = mode === 'share' ? series[k][i] / total : series[k][i];
    if (value >= base && value <= base + v) return c;
    base += v;
  }
  return null;
}
