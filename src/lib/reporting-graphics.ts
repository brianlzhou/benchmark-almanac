// The Reporting page's year graphics, as pure functions of the page data: the beeswarm of every benchmark labs
// named in a year, and one waffle per lab of what it named, by area. The server renders the default year with
// these and the page script renders the others with the same code. No data imports here: the browser loads it.

import { matrix, labHabits, esc, markHtml, FRONTIER_LABS, type RData, type View, type Row, type LabHabit } from './reporting-view.ts';

export const AREA_ORDER = ['knowledge', 'reasoning', 'code', 'agents', 'work', 'multimodal', 'safety', 'other'];

// The same shapes as src/components/AreaMark.astro, defined once as symbols that every chart on the page uses.
export const SHAPES: Record<string, string> = {
  knowledge: '<circle cx="5" cy="5" r="4.6"/>',
  reasoning: '<path d="M5 .6 9.6 9H.4z"/>',
  code: '<rect x=".8" y=".8" width="8.4" height="8.4" rx="1.2"/>',
  agents: '<path d="M5 .2 9.8 5 5 9.8.2 5z"/>',
  work: '<path d="M5 .4 9 2.7v4.6L5 9.6 1 7.3V2.7z"/>',
  multimodal: '<path d="M5 .3l1.4 3 3.3.4-2.4 2.3.6 3.3L5 7.7 2.1 9.3l.6-3.3L.3 3.7l3.3-.4z"/>',
  safety: '<path d="M3.4.6h3.2v2.8h2.8v3.2H6.6v2.8H3.4V6.6H.6V3.4h2.8z"/>',
  other: '<circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
};

// Each shape twice: a symbol that scales to any size, and a fixed 8.6px one centered on its point for the waffles,
// so a waffle cell is only its position.
export const symbolsSvg = () =>
  `<svg class="rp-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${AREA_ORDER.map(
    (a) => `<symbol id="rp-s-${a}" viewBox="0 0 10 10">${SHAPES[a]}</symbol><g id="rp-c-${a}" transform="translate(-4.3 -4.3) scale(.86)">${SHAPES[a]}</g>`,
  ).join('')}</defs></svg>`;

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const shape = (area: string, cx: number, cy: number, r: number) =>
  `<use href="#rp-s-${area}" class="a-${area}" x="${f1(cx - r)}" y="${f1(cy - r)}" width="${f1(2 * r)}" height="${f1(2 * r)}"/>`;

export const pct = (x: number) => `${Math.round(x * 100)}%`;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/** Small counts as words in a sentence: "five frontier labs". */
export const word = (n: number) => WORDS[n] ?? String(n);
/** Who the page is counting: every lab, or the frontier labs. */
export const who = (v: View) => (v.frontier ? 'frontier labs' : 'labs');
const num = (n: number) => n.toLocaleString('en-US');
const half = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

/** A rough width of a line of Geist text, a little generous, for placing labels without measuring the page. */
export function textW(s: string, size: number, mono = false): number {
  if (mono) return s.length * size * 0.6;
  let w = 0;
  for (const ch of s) w += /[il.,'’:;|!]/.test(ch) ? 0.28 : /[fjrt() -]/.test(ch) ? 0.38 : /[mwMW]/.test(ch) ? 0.86 : /[A-Z]/.test(ch) ? 0.68 : /[0-9]/.test(ch) ? 0.6 : 0.56;
  return w * size * 1.04;
}

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const hit = (a: Rect, b: Rect, pad = 2) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
// ---- the beeswarm ------------------------------------------------------------------------------------------

export interface SwarmOpts {
  key: 'wide' | 'narrow';
  /** 'h' runs the lab count across, 'v' runs it up the page. */
  orient: 'h' | 'v';
  W: number;
  /** Length of the lab-count axis. */
  len: number;
  /** A shape's radius is rk times the square root of its releases, so its area follows them. */
  rk: number;
  rMax: number;
  font: number;
  labels: number;
}
export const SWARMS: SwarmOpts[] = [
  { key: 'wide', orient: 'h', W: 1120, len: 1010, rk: 2.1, rMax: 21, font: 12.5, labels: 10 },
  { key: 'narrow', orient: 'v', W: 358, len: 640, rk: 1.55, rMax: 14, font: 11.5, labels: 8 },
];

interface Dot {
  row: Row;
  r: number;
  /** Along the lab-count axis. */
  m: number;
  /** Across it, 0 on the center line. */
  c: number;
  x: number;
  y: number;
}

/**
 * Packs one shape per benchmark: each sits inside its lab count's band and as close to the center line as it can
 * without touching another, biggest first. Bands use a square-root scale, so the crowded low counts get room.
 */
function pack(rows: Row[], maxLabs: number, o: SwarmOpts): { dots: Dot[]; at: (v: number) => number } {
  const s0 = Math.sqrt(0.5);
  const s1 = Math.sqrt(maxLabs + 0.5);
  const at = (v: number) => ((Math.sqrt(v) - s0) / (s1 - s0)) * o.len;
  const GAP = 1;
  const CELL = 10;
  const dots: Dot[] = rows.map((row) => ({ row, r: Math.min(o.rMax, o.rk * Math.sqrt(row.releases)), m: 0, c: 0, x: 0, y: 0 }));
  // every shape goes in each grid cell its box touches, so a check only reads the cells around one spot
  const grid = new Map<number, Dot[]>();
  const key = (i: number, j: number) => i * 8192 + j + 4096;
  const free = (m: number, c: number, r: number) => {
    const reach = r + GAP;
    const i1 = Math.floor((m + reach) / CELL);
    const j1 = Math.floor((c + reach) / CELL);
    for (let i = Math.floor((m - reach) / CELL); i <= i1; i++)
      for (let j = Math.floor((c - reach) / CELL); j <= j1; j++) {
        const qs = grid.get(key(i, j));
        if (!qs) continue;
        for (const q of qs) {
          const dm = q.m - m;
          const dc = q.c - c;
          const lim = q.r + r + GAP;
          if (dm * dm + dc * dc < lim * lim) return false;
        }
      }
    return true;
  };
  const put = (p: Dot) => {
    for (let i = Math.floor((p.m - p.r) / CELL); i <= Math.floor((p.m + p.r) / CELL); i++)
      for (let j = Math.floor((p.c - p.r) / CELL); j <= Math.floor((p.c + p.r) / CELL); j++) {
        const k = key(i, j);
        const qs = grid.get(k);
        if (qs) qs.push(p);
        else grid.set(k, [p]);
      }
  };
  // candidate spots per band, cheapest first: near the center line, then near the band's middle
  const byBand = new Map<number, Dot[]>();
  for (const p of dots) byBand.set(p.row.labs, [...(byBand.get(p.row.labs) ?? []), p]);
  const cands = new Map<number, Float64Array>();
  const ptr = new Map<number, { r: number; i: number }>();
  const candsFor = (n: number) => {
    let cs = cands.get(n);
    if (cs) return cs;
    const lo = at(n - 0.5);
    const hi = at(n + 0.5);
    const mid = at(n);
    const band = byBand.get(n)!;
    const need = band.reduce((s2, p) => s2 + (2 * p.r + GAP) ** 2, 0);
    const C = Math.ceil((need / Math.max(hi - lo, 2)) * 0.8 + 2 * Math.max(...band.map((p) => p.r)) + 12);
    // spots along the axis go out from the band's middle a pixel at a time, so the middle is always one of them
    const ms = [mid];
    for (let k2 = 1; mid - k2 >= lo; k2++) ms.push(mid - k2, mid + k2);
    // a counting sort on the cost in quarter steps: the same order a comparison sort gives, in linear time
    const n2 = ms.length * (2 * C + 1);
    const q = new Uint32Array(n2);
    const mv = new Float64Array(n2);
    const cv = new Float64Array(n2);
    let k = 0;
    let qMax = 0;
    for (const m of ms)
      for (let t = 0; t <= 2 * C; t++, k++) {
        const c = t % 2 ? (t + 1) / 2 : -t / 2;
        mv[k] = m;
        cv[k] = c;
        q[k] = Math.round((Math.abs(c) + 0.35 * Math.abs(m - mid)) * 4);
        if (q[k] > qMax) qMax = q[k];
      }
    const start = new Uint32Array(qMax + 2);
    for (let i = 0; i < n2; i++) start[q[i] + 1]++;
    for (let i = 1; i <= qMax + 1; i++) start[i] += start[i - 1];
    cs = new Float64Array(n2 * 2);
    for (let i = 0; i < n2; i++) {
      const at2 = start[q[i]]++;
      cs[2 * at2] = mv[i];
      cs[2 * at2 + 1] = cv[i];
    }
    cands.set(n, cs);
    return cs;
  };
  const order = [...dots].sort((a, b) => b.r - a.r || b.row.labs - a.row.labs || a.row.name.localeCompare(b.row.name));
  for (const p of order) {
    const n = p.row.labs;
    const cs = candsFor(n);
    const lo = at(n - 0.5);
    const hi = at(n + 0.5);
    // a shape stays inside its band where the band is wide enough, with a little air between bands
    const mg = Math.min(p.r + 1.5, (hi - lo) / 2);
    let placed = false;
    const pt = ptr.get(n);
    let i = pt && pt.r === p.r ? pt.i : 0;
    for (; i < cs.length / 2; i++) {
      const m = cs[2 * i];
      const c = cs[2 * i + 1];
      if (m < lo + mg - 0.01 || m > hi - mg + 0.01) continue;
      if (free(m, c, p.r)) {
        p.m = m;
        p.c = c;
        placed = true;
        break;
      }
    }
    ptr.set(n, { r: p.r, i });
    // past every prepared spot: keep going out from the middle until there is room
    // capped far beyond any real swarm, so no input can stall the page render
    for (let c = 0, k = 0; !placed && k < 20000; c = c > 0 ? -c : 1 - c, k++)
      if (free(at(n), c, p.r)) {
        p.m = at(n);
        p.c = c;
        placed = true;
      }
    put(p);
  }
  return { dots, at };
}

/** The rows a year's beeswarm draws: every benchmark named that year, versions as one. */
export function swarmRows(d: RData, v: View) {
  return matrix(d, { ...v, names: 'grouped', min: 1, q: '', sort: 'labs' });
}

/** The order the shapes appear in the page: fewest labs first, so the arrow keys move right through the chart. */
export const swarmOrder = (rows: Row[]) => [...rows].sort((a, b) => a.labs - b.labs || a.releases - b.releases || a.key.localeCompare(b.key));

/**
 * The beeswarm in a frame of fixed height, so switching views never moves the page: a view that needs more room
 * draws its shapes a little smaller (three tries at most), and one that needs less sits in the middle. Without a
 * frame it takes its natural height, which the server's default view sets for the rest.
 */
export function swarmSvg(d: RData, v: View, o: SwarmOpts, frame?: number): string {
  let opts = o;
  let out = drawSwarm(d, v, opts, 0);
  for (let k = 0; k < 3 && frame && out.height > frame + 0.5; k++) {
    const f = Math.sqrt(Math.max(0.2, (frame - 100) / Math.max(1, out.height - 100))) * 0.96;
    opts = { ...opts, rk: opts.rk * f, rMax: opts.rMax * f };
    out = drawSwarm(d, v, opts, 0);
  }
  if (frame && out.height && out.height < frame - 0.5) out = drawSwarm(d, v, opts, (frame - out.height) / 2);
  return out.svg;
}

function drawSwarm(d: RData, v: View, o: SwarmOpts, pad: number): { svg: string; height: number } {
  const mx = swarmRows(d, v);
  const rows = mx.rows;
  if (!rows.length) return { svg: `<p class="muted">No release named a benchmark in ${esc(v.year)}.</p>`, height: 0 };
  const maxLabs = Math.max(...rows.map((r) => r.labs));
  const { dots, at } = pack(rows, maxLabs, o);
  const H = o.orient === 'h';
  for (const p of dots) {
    p.x = H ? p.m : p.c;
    p.y = H ? p.c : -p.m;
  }
  const F = o.font;
  const labels: { x: number; y: number; anchor: string; name: string; n: number; w: number; rect: Rect }[] = [];
  const leaders: Seg[] = [];
  const notes: string[] = [];
  const taken: Rect[] = [];

  // the long tail: the band of benchmarks one lab named, with a bracket and its count
  const once = dots.filter((p) => p.row.labs === 1);
  if (once.length) {
    const x0 = Math.min(...once.map((p) => p.x - p.r));
    const x1 = Math.max(...once.map((p) => p.x + p.r));
    const y0 = Math.min(...once.map((p) => p.y - p.r));
    const y1 = Math.max(...once.map((p) => p.y + p.r));
    const big = `${num(once.length)} of ${num(rows.length)}`;
    const small = 'named by one lab';
    const w = Math.max(textW(big, 16, true), textW(small, F));
    if (H) {
      const by = y0 - 6;
      notes.push(`<path class="rp-br" d="M${f1(x0)},${f1(by + 4)}V${f1(by)}H${f1(x1)}V${f1(by + 4)}"/>`);
      notes.push(`<text class="rp-nb num" x="${f1(x0)}" y="${f1(by - 26)}">${big}</text><text class="rp-ns" x="${f1(x0)}" y="${f1(by - 9)}">${small}</text>`);
      taken.push({ x0, y0: by - 42, x1: Math.max(x1, x0 + w), y1: by + 4 });
    } else {
      // beside the pile when it fits, else under it; the frame's left edge comes from the shapes, so measure from them
      const left = Math.min(...dots.map((p) => p.x - p.r));
      const bx = x1 + 6;
      const cy = (y0 + y1) / 2;
      if (bx + 8 + w - left + 40 <= o.W - 2) {
        notes.push(`<path class="rp-br" d="M${f1(bx - 4)},${f1(y0)}H${f1(bx)}V${f1(y1)}H${f1(bx - 4)}"/>`);
        notes.push(`<text class="rp-nb num" x="${f1(bx + 8)}" y="${f1(cy - 3)}">${big}</text><text class="rp-ns" x="${f1(bx + 8)}" y="${f1(cy + 14)}">${small}</text>`);
        taken.push({ x0: bx - 4, y0: cy - 18, x1: bx + 8 + w, y1: cy + 18 });
      } else {
        const by = y1 + 6;
        notes.push(`<path class="rp-br" d="M${f1(x0)},${f1(by - 4)}V${f1(by)}H${f1(x1)}V${f1(by - 4)}"/>`);
        notes.push(`<text class="rp-nb num" x="${f1(x0)}" y="${f1(by + 20)}">${big}</text><text class="rp-ns" x="${f1(x0)}" y="${f1(by + 37)}">${small}</text>`);
        taken.push({ x0, y0: by - 4, x1: Math.max(x1, x0 + w), y1: by + 42 });
      }
    }
  }

  // the most widely named, labeled on the chart
  const top = [...dots].sort((a, b) => b.row.labs - a.row.labs || b.row.releases - a.row.releases || a.row.name.localeCompare(b.row.name)).slice(0, o.labels);
  const nameW = (p: Dot) => textW(p.row.name, F) + 5 + textW(String(p.row.labs), F - 1.5, true);
  if (H) {
    // two rails of labels, above and below the swarm: a shape in the upper half is named above it, one in the
    // lower half below. Along a rail the labels keep their shapes' order and push apart, so leaders never cross.
    const minX = Math.max(0, ...taken.map((t) => t.x1 + 12));
    const maxX = o.W - 4;
    for (const up of [true, false]) {
      const items = top
        .filter((p, i) => (p.c === 0 ? i % 2 === 0 : p.c < 0) === up)
        .map((p) => ({ p, w: nameW(p), x0: 0 }))
        .sort((a, b) => a.p.x - b.p.x);
      if (!items.length) continue;
      const GAP2 = 12;
      for (const [i, it] of items.entries()) it.x0 = Math.max(it.p.x - it.w / 2, minX, i ? items[i - 1].x0 + items[i - 1].w + GAP2 : -Infinity);
      for (let i = items.length - 1; i >= 0; i--) {
        const lim = i < items.length - 1 ? items[i + 1].x0 - GAP2 : maxX;
        if (items[i].x0 + items[i].w > lim) items[i].x0 = lim - items[i].w;
      }
      // the rail sits clear of every shape under any of its labels
      const x0 = Math.min(...items.map((it) => it.x0));
      const x1 = Math.max(...items.map((it) => it.x0 + it.w));
      const under = dots.filter((q) => q.x + q.r > x0 - 4 && q.x - q.r < x1 + 4);
      const base = up ? Math.min(...under.map((q) => q.y - q.r)) - 22 : Math.max(...under.map((q) => q.y + q.r)) + 22 + F;
      for (const it of items) {
        const rect = { x0: it.x0, y0: base - F, x1: it.x0 + it.w, y1: base + 3 };
        const ax = Math.min(Math.max(it.p.x, rect.x0 + 6), rect.x1 - 6);
        leaders.push(up ? { x1: it.p.x, y1: it.p.y - it.p.r - 1, x2: ax, y2: rect.y1 + 1 } : { x1: it.p.x, y1: it.p.y + it.p.r + 1, x2: ax, y2: rect.y0 - 1 });
        labels.push({ x: it.x0, y: base, anchor: 'start', name: it.p.row.name, n: it.p.row.labs, w: it.w, rect });
        taken.push(rect);
      }
    }
  } else {
    const ordered = [...top].sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const p of ordered) {
      const w = nameW(p);
      let base = Math.max(p.y + 4, prev + F + 4);
      const near = dots.filter((q) => q.y + q.r > base - F - 3 && q.y - q.r < base + 4);
      let x = Math.max(p.x + p.r, ...near.map((q) => q.x + q.r)) + 10;
      if (x + w > o.W - 2) x = o.W - 2 - w;
      const rect = { x0: x, y0: base - F, x1: x + w, y1: base + 3 };
      if (taken.some((t) => hit(t, rect))) {
        base = Math.max(...taken.filter((t) => hit(t, rect)).map((t) => t.y1)) + F + 4;
        rect.y0 = base - F;
        rect.y1 = base + 3;
      }
      labels.push({ x, y: base, anchor: 'start', name: p.row.name, n: p.row.labs, w, rect });
      leaders.push({ x1: p.x + p.r + 1, y1: p.y, x2: x - 3, y2: base - F * 0.35 });
      taken.push(rect);
      prev = base;
    }
  }

  // fit everything in the frame: ticks run under the swarm, or up its left side
  const ys = [...dots.map((p) => p.y - p.r), ...taken.map((t) => t.y0)];
  const ye = [...dots.map((p) => p.y + p.r), ...taken.map((t) => t.y1)];
  const xs = [...dots.map((p) => p.x - p.r), ...taken.map((t) => t.x0)];
  // up to a dozen labs get a tick each; past that, the low counts and then every fifth
  const ticks = maxLabs <= 12 ? Array.from({ length: maxLabs }, (_, i) => i + 1) : [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].filter((t) => t <= maxLabs);
  let dx: number;
  let dy: number;
  let height: number;
  let axis = '';
  if (H) {
    dx = 8 - Math.min(0, Math.min(...xs));
    dy = 10 - Math.min(...ys) + pad;
    const axisY = Math.max(...ye) + dy + 14;
    height = axisY + 40 + pad;
    axis =
      `<line class="rp-axl" x1="${f1(dx + at(0.5))}" x2="${f1(dx + at(maxLabs + 0.5))}" y1="${f1(axisY)}" y2="${f1(axisY)}"/>` +
      ticks.map((t) => `<line class="rp-axl" x1="${f1(dx + at(t))}" x2="${f1(dx + at(t))}" y1="${f1(axisY)}" y2="${f1(axisY + 4)}"/><text class="rp-tk num" x="${f1(dx + at(t))}" y="${f1(axisY + 17)}" text-anchor="middle">${t}</text>`).join('') +
      `<text class="rp-at" x="${f1(dx + at(0.5))}" y="${f1(axisY + 36)}">${v.frontier ? 'Frontier labs' : 'Labs'} that named it in ${esc(v.year)}</text>`;
  } else {
    dx = 40 - Math.min(...dots.map((p) => p.x - p.r));
    dy = 34 - Math.min(...ys) + pad;
    height = Math.max(...ye) + dy + 14 + pad;
    const axX = 30;
    axis =
      `<text class="rp-at" x="0" y="12">${v.frontier ? 'Frontier labs' : 'Labs'} that named it</text>` +
      `<line class="rp-axl" x1="${axX}" x2="${axX}" y1="${f1(dy - at(maxLabs + 0.5))}" y2="${f1(dy - at(0.5))}"/>` +
      ticks.map((t) => `<line class="rp-axl" x1="${axX - 4}" x2="${axX}" y1="${f1(dy - at(t))}" y2="${f1(dy - at(t))}"/><text class="rp-tk num" x="${axX - 7}" y="${f1(dy - at(t) + 3.5)}" text-anchor="end">${t}</text>`).join('');
  }
  const shift = (s: string) => s.replace(/\b(x|y)="(-?[\d.]+)"/g, (_, a: string, n: string) => `${a}="${f1(Number(n) + (a === 'x' ? dx : dy))}"`);
  // the note paths alternate x and y after M and L, and H and V take one value each
  const shiftPath = (s: string) =>
    s.replace(/d="([^"]+)"/, (_, p: string) => {
      const toks = p.match(/[MHVL]|-?[\d.]+/g) ?? [];
      let cmd = 'M';
      let k = 0;
      const out: string[] = [];
      for (const t of toks) {
        if (/[MHVL]/.test(t)) {
          cmd = t;
          k = 0;
          out.push(t);
          continue;
        }
        const isX = cmd === 'H' || ((cmd === 'M' || cmd === 'L') && k % 2 === 0);
        out.push(f1(Number(t) + (isX ? dx : dy)));
        k++;
      }
      return `d="${out.join(' ').replace(/ ([MHVL]) /g, '$1').replace(/([MHVL]) /g, '$1')}"`;
    });
  const noteSvg = notes.map((s) => (s.startsWith('<path') ? shiftPath(s) : shift(s))).join('');
  // one fixed order for both renders, so the page script can find a shape's benchmark by its place
  const byOrder = new Map(swarmOrder(rows).map((r, i) => [r, i]));
  const sorted = [...dots].sort((a, b) => byOrder.get(a.row)! - byOrder.get(b.row)!);
  const dotSvg = sorted
    .map((p) => {
      const u = shape(p.row.area, p.x + dx, p.y + dy, p.r);
      return H ? `<a href="${p.row.href}" aria-label="${esc(`${p.row.name}, ${p.row.labs} ${p.row.labs === 1 ? 'lab' : 'labs'}`)}">${u}</a>` : u;
    })
    .join('');
  const leadSvg = leaders.map((l) => `<line class="rp-ld" x1="${f1(l.x1 + dx)}" y1="${f1(l.y1 + dy)}" x2="${f1(l.x2 + dx)}" y2="${f1(l.y2 + dy)}"/>`).join('');
  const labelSvg = labels
    .map((l) => `<text class="rp-lb" x="${f1(l.x + dx)}" y="${f1(l.y + dy)}">${esc(l.name)}<tspan class="rp-lbn num" dx="5">${l.n}</tspan></text>`)
    .join('');
  const aria = `Every benchmark ${who(v)} named in ${v.year}, one shape each, placed by how many labs named it and sized by how many releases did. ${num(rows.length)} benchmarks, ${num(once.length)} named by one lab. ${top
    .slice(0, 3)
    .map((p) => `${p.row.name}: ${p.row.labs} labs`)
    .join('. ')}.`;
  const svg = H
    ? `<svg class="rp-swarm only-wide" viewBox="0 0 ${o.W} ${f1(height)}" role="group" aria-label="${esc(aria)}" data-rove>${axis}${noteSvg}${leadSvg}<g class="rp-dots">${dotSvg}</g>${labelSvg}</svg>`
    : `<svg class="rp-swarm only-narrow" viewBox="0 0 ${o.W} ${f1(height)}" role="img" aria-label="${esc(aria)}">${axis}${noteSvg}${leadSvg}<g class="rp-dots">${dotSvg}</g>${labelSvg}</svg>`;
  return { svg, height };
}

/** The page title: how many benchmarks labs named, and how many of them only one lab named. */
export function heroHead(d: RData, v: View): string {
  const m = swarmRows(d, v);
  const once = m.rows.filter((r) => r.labs === 1).length;
  if (!m.rows.length) return `No benchmarks named in ${v.year}`;
  return v.frontier
    ? `Of the ${num(m.rows.length)} benchmarks frontier labs named in ${v.year}, ${num(once)} were named by just one of them`
    : `Of the ${num(m.rows.length)} benchmarks labs named in ${v.year}, ${num(once)} were named by just one lab`;
}

/** The opening paragraph's numbers. */
export function heroLede(d: RData, v: View): string {
  const all = d.sources[v.year] ?? { posts: 0, docs: 0, frontier: { posts: 0, docs: 0 } };
  const s = v.frontier ? all.frontier : all;
  return `We counted every benchmark named in the ${num(s.posts)} launch posts ${who(v)} published in ${v.year}, and in the ${num(s.docs)} system cards, model cards and technical reports published with them. Each shape below is one benchmark. The more ${who(v)} named it, the further right it sits, and the more releases named it, the bigger it is.`;
}

/** The lookup table's heading: the benchmark the most labs named. */
export function lookupHead(d: RData, v: View): string {
  const m = matrix(d, { ...v, names: 'grouped', min: 1, q: '', sort: 'labs' });
  const lead = m.passing[0];
  if (!lead) return `No benchmarks named in ${v.year}`;
  const tied = m.passing.filter((r) => r.labs === lead.labs);
  // with a handful of labs, the news is how many benchmarks all of them named
  if (v.frontier && lead.labs === m.totalLabs) {
    // in a year when not every frontier lab published scores, say whose count it is
    const all = `all ${word(m.totalLabs)} frontier labs${m.totalLabs < FRONTIER_LABS.length ? ' that published scores' : ''}`;
    return tied.length === 1
      ? `${lead.name} was the only benchmark ${all} named in ${v.year}`
      : `${word(tied.length).replace(/^./, (c) => c.toUpperCase())} benchmarks were named by ${all} in ${v.year}`;
  }
  if (tied.length === 1) return `${lead.name} was named by ${lead.labs} of the ${m.totalLabs} ${who(v)} that published scores in ${v.year}`;
  const names = tied.length > 2 ? `${tied.length} benchmarks` : tied.map((r) => r.name).join(' and ');
  return `${names} were each named by ${lead.labs} of the ${m.totalLabs} ${who(v)} that published scores in ${v.year}`;
}

/** The lookup's paragraph: which labs the columns are. */
export function lookupLede(d: RData, v: View): string {
  const m = matrix(d, v);
  const cols = v.frontier
    ? `The columns are the ${word(m.cols.length)} frontier labs that published scores that year.`
    : `The columns are the ${m.cols.length} labs with the most releases that year${m.otherLabs ? ', and the last one adds up every other lab' : ''}.`;
  return `Look up any benchmark and lab. Each dot counts the lab's releases whose launch post or documents named the benchmark, in the benchmark's area color. ${cols} Point at a dot to see the releases and the scores they reported.`;
}

// ---- lab fingerprints ----------------------------------------------------------------------------------------

/** Shares that add up to exactly 100 cells, by largest remainder. */
function hundred(counts: number[]): number[] {
  const total = counts.reduce((s, c) => s + c, 0) || 1;
  const raw = counts.map((c) => (c / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, c) => s + c, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    if (counts[i] > 0) {
      out[i]++;
      left--;
    }
  }
  return out;
}

const mixOf = (h: LabHabit) => AREA_ORDER.map((a) => (h.areas[a] ?? 0) / h.uses);

/** The labs to draw, most releases first, then chained so each sits beside the one whose mix is closest. */
export function printLabs(d: RData, v: View, max = 16): LabHabit[] {
  const hs = labHabits(d, { ...v, names: 'grouped' })
    .filter((h) => h.releases >= 2)
    .slice(0, max);
  if (hs.length < 3) return hs;
  const dist = (a: LabHabit, b: LabHabit) => {
    const x = mixOf(a);
    const y = mixOf(b);
    return x.reduce((s, v2, i) => s + Math.abs(v2 - y[i]), 0);
  };
  const out = [hs[0]];
  const rest = hs.slice(1);
  while (rest.length) {
    const last = out.at(-1)!;
    let bi = 0;
    for (let i = 1; i < rest.length; i++) if (dist(last, rest[i]) < dist(last, rest[bi]) - 1e-9) bi = i;
    out.push(rest.splice(bi, 1)[0]);
  }
  return out;
}

export function printsHtml(d: RData, v: View): string {
  const hs = printLabs(d, v);
  if (!hs.length) return `<p class="muted">No lab published two or more releases with scores in ${esc(v.year)}.</p>`;
  const areaName = new Map(d.areas.map((a) => [a.id, a.name]));
  const P = 12;
  return hs
    .map((h, hi) => {
      const lab = d.labs[h.lab];
      const counts = AREA_ORDER.map((a) => h.areas[a] ?? 0);
      const cells = hundred(counts);
      let i = 0;
      const groups = AREA_ORDER.map((a, ai) => {
        if (!cells[ai]) return '';
        const marks: string[] = [];
        for (let k = 0; k < cells[ai]; k++, i++) marks.push(`<use href="#rp-c-${a}" x="${(i % 10) * P + P / 2}" y="${Math.floor(i / 10) * P + P / 2}"/>`);
        return `<g class="a-${a}" data-tv="${pct(counts[ai] / h.uses)}" data-tn="${esc(areaName.get(a) ?? a)}" data-ts="${counts[ai]} of the ${h.uses} benchmarks ${esc(lab.name)} named across its releases">${marks.join('')}</g>`;
      }).join('');
      const lead = AREA_ORDER.map((a, ai) => [a, counts[ai]] as const)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .filter(([, c]) => c > 0)
        .map(([a, c]) => `${pct(c / h.uses)} ${(areaName.get(a) ?? a).toLowerCase()}`)
        .join(', ');
      const name = lab.page ? `<a href="/labs/${esc(lab.id)}/">${esc(lab.name)}</a>` : `<span>${esc(lab.name)}</span>`;
      return (
        `<figure class="rp-fp" tabindex="${hi === 0 ? 0 : -1}" data-tv="${esc(lab.name)}" data-tn="${esc(lead)}" data-ts="${h.uses} benchmark uses in ${h.releases} releases">` +
        `<figcaption>${markHtml(lab, 18)}${name}<span class="rp-fpr num">${h.releases}</span></figcaption>` +
        `<svg class="rp-wf" viewBox="0 0 ${10 * P} ${10 * P}" role="img" aria-label="${esc(`${lab.name} in ${v.year}: ${lead}`)}">${groups}</svg>` +
        `<dl class="rp-fs">` +
        `<div><dt>Their own</dt><dd class="num"><span class="rp-fb" aria-hidden="true"><i style="width:${Math.round(h.made * 100)}%"></i></span>${pct(h.made)}</dd></div>` +
        `<div><dt>Shared</dt><dd class="num"><span class="rp-fb" aria-hidden="true"><i style="width:${Math.round(h.shared * 100)}%"></i></span>${pct(h.shared)}</dd></div>` +
        `<div><dt>Per release</dt><dd class="num">${half(h.median)}</dd></div>` +
        `</dl></figure>`
      );
    })
    .join('');
}

/** Each area's share of every benchmark use in a year. */
function areaShares(d: RData, v: View): Record<string, number> {
  const hs = labHabits(d, { ...v, names: 'grouped' });
  const tot: Record<string, number> = {};
  let all = 0;
  for (const h of hs)
    for (const [a, n] of Object.entries(h.areas)) {
      tot[a] = (tot[a] ?? 0) + n;
      all += n;
    }
  return Object.fromEntries(Object.entries(tot).map(([a, n]) => [a, n / (all || 1)]));
}

/** The lab section's heading: the area whose share moved most since the year before, or the biggest area. */
export function printsHead(d: RData, v: View): string {
  const now = areaShares(d, v);
  const name = (a: string) => d.areas.find((x) => x.id === a)?.name ?? a;
  const prevYear = String(Number(v.year) - 1);
  if (d.years.includes(prevYear)) {
    const then = areaShares(d, { ...v, year: prevYear });
    // the biggest gain is the news; with no gain of a point or more, the biggest fall
    const all = AREA_ORDER.map((a) => ({ a, from: then[a] ?? 0, to: now[a] ?? 0 }));
    const gain = [...all].sort((x, y) => y.to - y.from - (x.to - x.from))[0];
    const fall = [...all].sort((x, y) => x.to - x.from - (y.to - y.from))[0];
    const moved = gain && gain.to - gain.from >= 0.01 ? gain : fall;
    if (moved && Math.round(moved.to * 100) !== Math.round(moved.from * 100))
      return `${name(moved.a)} ${moved.to > moved.from ? 'rose' : 'fell'} from ${pct(moved.from)} of what ${who(v)} reported in ${prevYear} to ${pct(moved.to)} in ${v.year}`;
  }
  const topA = Object.entries(now).sort((a, b) => b[1] - a[1])[0];
  return topA ? `${name(topA[0])} made up ${pct(topA[1])} of what ${who(v)} reported in ${v.year}, more than any other area` : `What each lab reported in ${v.year}`;
}

/** The lab section's paragraph. */
export function printsLede(d: RData, v: View): string {
  const n = printLabs(d, v).length;
  const labs = v.frontier
    ? `the ${word(n)} frontier labs${n < FRONTIER_LABS.length ? ' with two or more releases' : ''}`
    : `the ${n} labs with the most releases`;
  return `What each of ${labs} named in ${v.year}, by area. Each grid has 100 shapes, one for every 1% of the benchmarks the lab named across its releases. Labs with similar mixes sit side by side. "Their own" is the share the lab made itself, alone or with others, and "Shared" is the share that at least three other ${who(v)} also named that year.`;
}
