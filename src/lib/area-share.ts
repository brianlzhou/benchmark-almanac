// The model-card area chart, drawn as an SVG string so the build and the browser share one renderer. The
// build draws the default view (each area's share, all areas). The browser redraws it when a reader switches
// between share and count, opens an area to see its categories and a category to see its subcategories, or
// switches to the difficulty views: every benchmark by level, or one small chart per area by level.
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
  /** The same mentions by difficulty level. Benchmarks without a level are left out. */
  lv: LevelData;
}

/** Mentions by level, easiest first: for all areas, and for each area on its own. */
export interface LevelData {
  ids: string[];
  names: string[];
  /** Who could solve the tasks at each level, for the key's tooltips. */
  who: string[];
  /** Per level, mentions per half year. */
  all: number[][];
  /** Per area, per level, mentions per half year. */
  areas: { id: string; n: string; v: number[][] }[];
}

export type ShareMode = 'share' | 'count';
export type ShareView = 'area' | 'level' | 'both';

/** In the small charts per area, a half year with fewer mentions than this is left out of the shares. */
export const MINI_MIN = 10;
/** The small charts start here, since few launch posts before 2024 had scores. */
export const MINI_FROM = '2024-H1';

export interface ShareSize {
  key: string;
  w: number;
  h: number;
  font: number;
  label: boolean;
}

const PAD = { l: 46, r: 150, t: 8, b: 30 };

// The count axis ends on the first tick at or above the tallest stack, so no stack runs past the top.
function countAxis(totals: number[]): { top: number; ticks: number[] } {
  const max = Math.max(1, ...totals);
  const t = niceTicks(0, max, 4);
  const step = t.length > 1 ? t[1] - t[0] : 1;
  const ticks = t.at(-1)! < max ? [...t, Number((t.at(-1)! + step).toFixed(10))] : t;
  return { top: ticks.at(-1)!, ticks };
}

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

/**
 * A child's fill: an area's own color at the top level. Inside an area, its children take shades of that
 * color, from one mixed toward the text color to one mixed toward the page, so they stay apart in both themes.
 */
export function fillOf(path: string[], i: number, k: number, id: string): string {
  const area = `var(--area-${path[0] ?? id})`;
  if (!path.length || k < 2) return area;
  const s = i / (k - 1);
  if (s < 0.3) return `color-mix(in oklab, ${area} ${Math.round(100 - 30 * (1 - s / 0.3))}%, var(--ink))`;
  return `color-mix(in oklab, ${area} ${Math.round(100 - 62 * ((s - 0.3) / 0.7))}%, var(--bg))`;
}

export function periodName(data: ShareData, i: number): string {
  const k = data.b[i];
  const base = `${k.slice(0, 4)}, ${k.endsWith('H1') ? 'first half' : 'second half'}`;
  return i === data.b.length - 1 && data.f < 1 ? `${base}, through ${data.asOf}` : base;
}

export function levelName(path: string[]): string {
  if (!path.length) return 'area';
  return path.length === 1 ? 'category' : 'subcategory';
}

/**
 * Stacked areas over time. The x axis is time: each half year spans its own six months, its point sits in
 * its middle, and each year's label sits on January 1. The last half year is as wide as the time that has
 * passed in it. In share mode a half year with no posts is left out and the bands join across it.
 */
export function renderShare(data: ShareData, mode: ShareMode, path: string[], size: ShareSize): string {
  const kids = nodeAt(data.root, path).c ?? [];
  return stack({
    data,
    mode,
    size,
    pad: PAD,
    bands: kids.map((c, k) => ({ n: c.n, v: values(c, data.b.length), fill: fillOf(path, k, kids.length, c.id) })),
    aria: `${mode === 'share' ? 'Share' : 'Number'} of headline benchmarks in launch posts by ${levelName(path)}, by half year`,
    go: kids.some((c) => !!opens(c)),
  });
}

/** A level's fill: one ink ramp, lightest for everyday tasks and darkest for the research frontier. */
export const levelFill = (i: number) => `var(--lvl-${i + 1})`;

/** Every mention by level, easiest at the bottom. */
export function renderLevels(data: ShareData, mode: ShareMode, size: ShareSize): string {
  return stack({
    data,
    mode,
    size,
    pad: PAD,
    bands: data.lv.ids.map((_, k) => ({ n: data.lv.names[k], v: data.lv.all[k], fill: levelFill(k) })),
    aria: `${mode === 'share' ? 'Share' : 'Number'} of headline benchmarks in launch posts by difficulty level, by half year`,
    go: false,
  });
}

/** The small charts per area: four columns on wide screens, two on phones. */
export function miniSizes(): ShareSize[] {
  return [
    { key: 'wide', w: 262, h: 140, font: 11, label: false },
    { key: 'narrow', w: 172, h: 112, font: 10, label: false },
  ];
}
const MINI_PAD = { l: 36, r: 6, t: 6, b: 22 };

/** The count axis the small charts share, so a busy area looks busier than a quiet one. */
export function miniTop(data: ShareData): number {
  const from = Math.max(0, data.b.indexOf(MINI_FROM));
  let max = 1;
  for (const a of data.lv.areas)
    for (let i = from; i < data.b.length; i++)
      max = Math.max(
        max,
        a.v.reduce((s, v) => s + v[i], 0),
      );
  return countAxis([max]).top;
}

/** One area's mentions by level. */
export function renderMini(data: ShareData, mode: ShareMode, area: string, size: ShareSize, top: number): string {
  const a = data.lv.areas.find((x) => x.id === area);
  if (!a) return '';
  return stack({
    data,
    mode,
    size,
    pad: MINI_PAD,
    bands: data.lv.ids.map((_, k) => ({ n: data.lv.names[k], v: a.v[k], fill: levelFill(k) })),
    aria: `${a.n}: ${mode === 'share' ? 'share' : 'number'} of headline benchmarks by difficulty level, by half year`,
    go: false,
    from: Math.max(0, data.b.indexOf(MINI_FROM)),
    min: MINI_MIN,
    top: mode === 'count' ? top : undefined,
    ticks: [0, 0.5, 1],
  });
}

/** The key for the difficulty views: each level's swatch and name, with who could solve it on hover. */
export function levelKey(lv: LevelData): string {
  return lv.ids
    .map((_, k) => `<span class="tag" title="${esc(lv.who[k])}"><span class="as-sw" style="background:${levelFill(k)}"></span>${esc(lv.names[k])}</span>`)
    .join('');
}

interface StackSpec {
  data: ShareData;
  mode: ShareMode;
  size: ShareSize;
  pad: { l: number; r: number; t: number; b: number };
  bands: { n: string; v: number[]; fill: string }[];
  aria: string;
  /** A click on a column opens the band under the pointer. */
  go: boolean;
  /** The first half year drawn. */
  from?: number;
  /** In share mode, a half year with fewer mentions than this is left out, and the bands join across it. */
  min?: number;
  /** A count axis shared with other charts. */
  top?: number;
  /** The share ticks. */
  ticks?: number[];
}

/**
 * Stacked areas over time, first band at the bottom. Direct labels go at the right edge when the size
 * allows, and each half year gets a hover column across its own span.
 */
function stack(s: StackSpec): string {
  const { data, mode, bands } = s;
  const { w, h, font, label } = s.size;
  const nb = data.b.length;
  const from = Math.min(s.from ?? 0, nb - 1);
  const min = s.min ?? 1;
  const series = bands.map((b) => b.v);
  const totals = data.b.map((_, i) => series.reduce((sum, v) => sum + v[i], 0));
  const end = nb - 1 + data.f;
  const mid = (i: number) => (i === nb - 1 ? i + data.f / 2 : i + 0.5);
  const right = label ? s.pad.r : Math.min(s.pad.r, 12);
  const shareTicks = s.ticks ?? [0, 0.25, 0.5, 0.75, 1];
  const count = s.top !== undefined ? { top: s.top, ticks: [0, s.top / 2, s.top] } : countAxis(totals.slice(from));
  const { top, ticks } = mode === 'share' ? { top: 1, ticks: shareTicks } : count;
  const tickText = (v: number) => (mode === 'share' ? `${Math.round(v * 100)}%` : v.toLocaleString('en-US'));
  // room on the left for the widest tick label, in a monospace font
  const left = Math.max(s.pad.l, Math.ceil(Math.max(...ticks.map((v) => tickText(v).length)) * font * 0.62) + 16);
  const x = linear([from, end], [left, w - right]);
  const y = linear([0, top], [h - s.pad.b, s.pad.t]);

  // the buckets drawn, and the x positions of the points: each bucket's middle, plus flat ends at the edges
  const drawn = data.b.map((_, i) => i).filter((i) => i >= from && (mode === 'count' || totals[i] >= min));
  const first = drawn[0];
  const last = drawn.at(-1);
  const out: string[] = [];
  out.push(`<svg class="only-${s.size.key}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(s.aria)}" style="--f:${font}px">`);
  for (const v of ticks) out.push(`<text x="${left - 12}" y="${r1(y(v) + 4)}" class="tick" text-anchor="end">${tickText(v)}</text>`);
  if (first !== undefined && last !== undefined) {
    const xs = [first, ...drawn.map(mid), last === nb - 1 ? end : last + 1].map((v) => r1(x(v)));
    const at = (k: number, i: number) => (mode === 'share' ? (totals[i] ? series[k][i] / totals[i] : 0) : series[k][i]);
    const pts = (k: number) => [first, ...drawn, last].map((i) => at(k, i));
    let lo = pts(0).map(() => 0);
    bands.forEach((b, k) => {
      const v = pts(k);
      const hi = lo.map((p, j) => p + v[j]);
      // a band that is empty everywhere draws nothing, so it leaves no stray gap line
      if (v.some((p) => p > 0)) {
        const upper = hi.map((p, j) => `${xs[j]},${r1(y(p))}`).join(' L');
        const lower = lo.map((p, j) => `${xs[j]},${r1(y(p))}`).reverse().join(' L');
        out.push(`<path d="M${upper} L${lower} Z" style="fill:${b.fill}" class="layer"/>`);
      }
      lo = hi;
    });
    // direct labels at the right edge, where a band is tall enough to hold one
    if (label) {
      let base = 0;
      const j = xs.length - 1;
      bands.forEach((b, k) => {
        const v = pts(k)[j];
        const thick = Math.abs(y(base) - y(base + v));
        if (thick >= 16) out.push(`<text x="${r1(xs[j] + 10)}" y="${r1((y(base) + y(base + v)) / 2 + 4)}" class="end">${esc(b.n)}</text>`);
        base += v;
      });
    }
  }
  out.push(`<line x1="${left - 4}" x2="${r1(x(end))}" y1="${r1(y(0))}" y2="${r1(y(0))}" class="axis"/>`);
  out.push(`<line x1="${left - 4}" x2="${left - 4}" y1="${r1(y(top))}" y2="${r1(y(0))}" class="axis"/>`);
  for (const v of ticks) out.push(`<line x1="${left - 8}" x2="${left - 4}" y1="${r1(y(v))}" y2="${r1(y(v))}" class="axis"/>`);
  // each year's label sits on its January 1
  data.b.forEach((k, i) => {
    if (!k.endsWith('H1') || i < from) return;
    const at = r1(x(i));
    out.push(`<line x1="${at}" x2="${at}" y1="${r1(y(0))}" y2="${r1(y(0) + 5)}" class="axis"/>`);
    out.push(`<text x="${at}" y="${r1(h - Math.max(4, s.pad.b - font - 9.5))}" class="tick" text-anchor="middle">${k.slice(0, 4)}</text>`);
  });
  // one hover column per half year, across its own span
  data.b.forEach((_, i) => {
    if (i < from) return;
    const x0 = r1(x(i));
    const x1 = r1(x(Math.min(i + 1, end)));
    const thin = mode === 'share' && totals[i] < min;
    const parts = thin
      ? [`Too few to chart a share`]
      : bands
          .map((b, k) => ({ n: b.n, v: series[k][i] }))
          .filter((z) => z.v > 0 && (mode === 'count' || z.v / (totals[i] || 1) >= 0.01))
          .sort((p, q) => q.v - p.v)
          .map((z) => (mode === 'share' ? `${z.n} ${Math.round((z.v / totals[i]) * 100)}%` : `${z.n} ${z.v}`));
    const tv = `${totals[i].toLocaleString('en-US')} benchmark ${totals[i] === 1 ? 'mention' : 'mentions'}`;
    out.push(
      `<rect x="${x0}" y="${s.pad.t}" width="${r1(x1 - x0)}" height="${h - s.pad.t - s.pad.b}" class="hit${s.go ? ' go' : ''}" data-j="${i}" data-tv="${esc(tv)}" data-tn="${esc(periodName(data, i))}" data-ts="${esc(parts.join('. '))}"/>`,
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
  const top = mode === 'share' ? 1 : countAxis(totals).top;
  const value = linear([size.h - PAD.b, PAD.t], [0, top])(py);
  let base = 0;
  for (const [k, c] of kids.entries()) {
    const v = mode === 'share' ? series[k][i] / total : series[k][i];
    if (value >= base && value <= base + v) return c;
    base += v;
  }
  return null;
}
