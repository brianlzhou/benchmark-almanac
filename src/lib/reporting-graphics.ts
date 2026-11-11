// The Reporting page's year graphics, as pure functions of the page data: the beeswarm of every benchmark labs
// named in a year, and one waffle per lab of what it named, by area. The server renders the default year with
// these and the page script renders the others with the same code. No data imports here: the browser loads it.

import { matrix, labHabits, esc, markHtml, type RData, type View, type Row, type LabHabit } from './reporting-view.ts';

export const AREA_ORDER = ['knowledge', 'reasoning', 'code', 'agents', 'work', 'multimodal', 'safety', 'other'];

// The same shapes as src/components/AreaMark.astro, defined once as symbols that every chart on the page uses.
const SHAPES: Record<string, string> = {
  knowledge: '<circle cx="5" cy="5" r="4.6"/>',
  reasoning: '<path d="M5 .6 9.6 9H.4z"/>',
  code: '<rect x=".8" y=".8" width="8.4" height="8.4" rx="1.2"/>',
  agents: '<path d="M5 .2 9.8 5 5 9.8.2 5z"/>',
  work: '<path d="M5 .4 9 2.7v4.6L5 9.6 1 7.3V2.7z"/>',
  multimodal: '<path d="M5 .3l1.4 3 3.3.4-2.4 2.3.6 3.3L5 7.7 2.1 9.3l.6-3.3L.3 3.7l3.3-.4z"/>',
  safety: '<path d="M3.4.6h3.2v2.8h2.8v3.2H6.6v2.8H3.4V6.6H.6V3.4h2.8z"/>',
  other: '<circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
};

export const symbolsSvg = () =>
  `<svg class="rp-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${AREA_ORDER.map((a) => `<symbol id="rp-s-${a}" viewBox="0 0 10 10">${SHAPES[a]}</symbol>`).join('')}</defs></svg>`;

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const shape = (area: string, cx: number, cy: number, r: number, extra = '') =>
  `<use href="#rp-s-${area}" class="rp-u a-${area}" x="${f1(cx - r)}" y="${f1(cy - r)}" width="${f1(2 * r)}" height="${f1(2 * r)}"${extra}/>`;

export const pct = (x: number) => `${Math.round(x * 100)}%`;
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
  const SMALL = 6;
  const CELL = 12;
  const dots: Dot[] = rows.map((row) => ({ row, r: Math.min(o.rMax, o.rk * Math.sqrt(row.releases)), m: 0, c: 0, x: 0, y: 0 }));
  const big: Dot[] = [];
  const grid = new Map<string, Dot[]>();
  const free = (m: number, c: number, r: number) => {
    for (const q of big) if ((q.m - m) ** 2 + (q.c - c) ** 2 < (q.r + r + GAP) ** 2) return false;
    const reach = r + SMALL + GAP;
    for (let i = Math.floor((m - reach) / CELL); i <= Math.floor((m + reach) / CELL); i++)
      for (let j = Math.floor((c - reach) / CELL); j <= Math.floor((c + reach) / CELL); j++)
        for (const q of grid.get(`${i},${j}`) ?? []) if ((q.m - m) ** 2 + (q.c - c) ** 2 < (q.r + r + GAP) ** 2) return false;
    return true;
  };
  const put = (p: Dot) => {
    if (p.r > SMALL) big.push(p);
    else {
      const k = `${Math.floor(p.m / CELL)},${Math.floor(p.c / CELL)}`;
      grid.set(k, [...(grid.get(k) ?? []), p]);
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
    const need = byBand.get(n)!.reduce((s, p) => s + (2 * p.r + GAP) ** 2, 0);
    const C = Math.ceil((need / Math.max(hi - lo, 2)) * 0.8 + 2 * o.rMax + 24);
    const list: [number, number, number][] = [];
    const ms = hi - lo < 1 ? [mid] : Array.from({ length: Math.floor(hi - lo) + 1 }, (_, i) => lo + i + (hi - lo - Math.floor(hi - lo)) / 2);
    for (const m of ms) for (let c = -C; c <= C; c++) list.push([m, c, Math.abs(c) + 0.35 * Math.abs(m - mid)]);
    list.sort((a, b) => a[2] - b[2]);
    cs = new Float64Array(list.length * 2);
    list.forEach(([m, c], i) => {
      cs![2 * i] = m;
      cs![2 * i + 1] = c;
    });
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
    const pt = ptr.get(n);
    let i = pt && pt.r === p.r ? pt.i : 0;
    for (; i < cs.length / 2; i++) {
      const m = cs[2 * i];
      const c = cs[2 * i + 1];
      if (m < lo + mg - 0.01 || m > hi - mg + 0.01) continue;
      if (free(m, c, p.r)) {
        p.m = m;
        p.c = c;
        break;
      }
    }
    ptr.set(n, { r: p.r, i });
    put(p);
  }
  return { dots, at };
}

/** The rows a year's beeswarm draws: every benchmark named that year, versions as one. */
export function swarmRows(d: RData, v: View) {
  return matrix(d, { ...v, names: 'grouped', min: 1, q: '', sort: 'labs' });
}

export function swarmSvg(d: RData, v: View, o: SwarmOpts): string {
  const mx = swarmRows(d, v);
  const rows = mx.rows;
  if (!rows.length) return `<p class="muted">No release named a benchmark in ${esc(v.year)}.</p>`;
  const maxLabs = Math.max(...rows.map((r) => r.labs));
  const { dots, at } = pack(rows, maxLabs, o);
  const H = o.orient === 'h';
  for (const p of dots) {
    p.x = H ? p.m : p.c;
    p.y = H ? p.c : -p.m;
  }
  const F = o.font;
  const labels: { x: number; y: number; anchor: string; name: string; n: number; w: number; rect: Rect }[] = [];
  const leaders: { x1: number; y1: number; x2: number; y2: number }[] = [];
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
      const bx = x1 + 6;
      const cy = (y0 + y1) / 2;
      notes.push(`<path class="rp-br" d="M${f1(bx - 4)},${f1(y0)}H${f1(bx)}V${f1(y1)}H${f1(bx - 4)}"/>`);
      notes.push(`<text class="rp-nb num" x="${f1(bx + 8)}" y="${f1(cy - 3)}">${big}</text><text class="rp-ns" x="${f1(bx + 8)}" y="${f1(cy + 14)}">${small}</text>`);
      taken.push({ x0: bx - 4, y0: cy - 18, x1: bx + 8 + w, y1: cy + 18 });
    }
  }

  // the most widely named, labeled on the chart
  const top = [...dots].sort((a, b) => b.row.labs - a.row.labs || b.row.releases - a.row.releases || a.row.name.localeCompare(b.row.name)).slice(0, o.labels);
  const nameW = (p: Dot) => textW(p.row.name, F) + 5 + textW(String(p.row.labs), F - 1.5, true);
  if (H) {
    for (const p of top) {
      const w = nameW(p);
      const cx = Math.min(Math.max(p.x, w / 2), o.W - 40 - w / 2);
      const x0 = cx - w / 2;
      const x1 = cx + w / 2;
      const under = dots.filter((q) => q.x + q.r > x0 - 3 && q.x - q.r < x1 + 3);
      const localTop = Math.min(p.y - p.r, ...under.map((q) => q.y - q.r));
      const localBot = Math.max(p.y + p.r, ...under.map((q) => q.y + q.r));
      let done = false;
      for (let k = 0; k < 9 && !done; k++)
        for (const up of [true, false]) {
          const base = up ? localTop - 8 - k * 17 : localBot + 8 + F + k * 17;
          const rect = { x0, y0: base - F, x1, y1: base + 3 };
          const ln = up ? { x1: p.x, y1: p.y - p.r - 1, x2: p.x, y2: rect.y1 + 1 } : { x1: p.x, y1: p.y + p.r + 1, x2: p.x, y2: rect.y0 - 1 };
          const lr = { x0: ln.x1 - 0.5, y0: Math.min(ln.y1, ln.y2), x1: ln.x1 + 0.5, y1: Math.max(ln.y1, ln.y2) };
          if (taken.some((t) => hit(t, rect)) || taken.some((t) => hit(t, lr, 0)) || leaders.some((l) => hit({ x0: l.x1 - 0.5, y0: Math.min(l.y1, l.y2), x1: l.x1 + 0.5, y1: Math.max(l.y1, l.y2) }, rect, 1)))
            continue;
          labels.push({ x: x0, y: base, anchor: 'start', name: p.row.name, n: p.row.labs, w, rect });
          if (Math.abs(ln.y2 - ln.y1) > 3) leaders.push(ln);
          taken.push(rect);
          done = true;
          break;
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
  const ticks = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].filter((t) => t <= maxLabs);
  let dx: number;
  let dy: number;
  let height: number;
  let axis = '';
  if (H) {
    dx = 8 - Math.min(0, Math.min(...xs));
    dy = 10 - Math.min(...ys);
    const axisY = Math.max(...ye) + dy + 14;
    height = axisY + 40;
    axis =
      `<line class="rp-axl" x1="${f1(dx + at(0.5))}" x2="${f1(dx + at(maxLabs + 0.5))}" y1="${f1(axisY)}" y2="${f1(axisY)}"/>` +
      ticks.map((t) => `<line class="rp-axl" x1="${f1(dx + at(t))}" x2="${f1(dx + at(t))}" y1="${f1(axisY)}" y2="${f1(axisY + 4)}"/><text class="rp-tk num" x="${f1(dx + at(t))}" y="${f1(axisY + 17)}" text-anchor="middle">${t}</text>`).join('') +
      `<text class="rp-at" x="${f1(dx + at(0.5))}" y="${f1(axisY + 36)}">Labs that named it in ${esc(v.year)}</text>`;
  } else {
    dx = 40 - Math.min(...dots.map((p) => p.x - p.r));
    dy = 34 - Math.min(...ys);
    height = Math.max(...ye) + dy + 14;
    const axX = 30;
    axis =
      `<text class="rp-at" x="0" y="12">Labs that named it</text>` +
      `<line class="rp-axl" x1="${axX}" x2="${axX}" y1="${f1(dy - at(maxLabs + 0.5))}" y2="${f1(dy - at(0.5))}"/>` +
      ticks.map((t) => `<line class="rp-axl" x1="${axX - 4}" x2="${axX}" y1="${f1(dy - at(t))}" y2="${f1(dy - at(t))}"/><text class="rp-tk num" x="${axX - 7}" y="${f1(dy - at(t) + 3.5)}" text-anchor="end">${t}</text>`).join('');
  }
  const T = (x: number, y: number) => `${f1(x + dx)},${f1(y + dy)}`;
  const shift = (s: string) => s.replace(/(\bx\d?|\by\d?)="(-?[\d.]+)"/g, (_, a: string, n: string) => `${a}="${f1(Number(n) + (a.startsWith('x') ? dx : dy))}"`);
  const pathShift = (s: string) =>
    s.replace(/d="([^"]+)"/, (_, p: string) => {
      let axisX = true;
      const out = p.replace(/([MHVL])|(-?[\d.]+)/g, (m, cmd: string) => {
        if (cmd) {
          axisX = cmd !== 'V';
          return m;
        }
        const v2 = Number(m) + (axisX ? dx : dy);
        if (cmd === undefined && axisX && /M|L/.test('')) axisX = false;
        return f1(v2);
      });
      return `d="${out}"`;
    });
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
  void pathShift;
  const noteSvg = notes.map((s) => (s.startsWith('<path') ? shiftPath(s) : shift(s))).join('');
  const sorted = [...dots].sort((a, b) => a.row.labs - b.row.labs || (H ? a.x - b.x : b.y - a.y) || (H ? a.y - b.y : a.x - b.x));
  const lead = top[0];
  const dotSvg = sorted
    .map((p) => {
      const label = `${p.row.name}${p.row.org ? `, by ${p.row.org}` : ''}: ${p.row.labs} ${p.row.labs === 1 ? 'lab' : 'labs'}, ${p.row.releases} ${p.row.releases === 1 ? 'release' : 'releases'}`;
      return `<a class="rp-d" href="${p.row.href}" data-k="${esc(p.row.key)}" tabindex="${p === lead ? 0 : -1}" aria-label="${esc(label)}">${shape(p.row.area, p.x + dx, p.y + dy, p.r)}</a>`;
    })
    .join('');
  const leadSvg = leaders.map((l) => `<line class="rp-ld" x1="${f1(l.x1 + dx)}" y1="${f1(l.y1 + dy)}" x2="${f1(l.x2 + dx)}" y2="${f1(l.y2 + dy)}"/>`).join('');
  const labelSvg = labels
    .map((l) => `<text class="rp-lb" x="${f1(l.x + dx)}" y="${f1(l.y + dy)}">${esc(l.name)}<tspan class="rp-lbn num" dx="5">${l.n}</tspan></text>`)
    .join('');
  void T;
  const width = H ? o.W : o.W;
  const aria = `Every benchmark labs named in ${v.year}, one shape each, placed by how many labs named it and sized by how many releases did. ${num(rows.length)} benchmarks, ${num(once.length)} named by one lab. ${rows
    .slice(0, 3)
    .map((r) => `${r.name}: ${r.labs} labs`)
    .join('. ')}.`;
  return `<svg class="rp-swarm only-${o.key}" viewBox="0 0 ${width} ${f1(height)}" style="--f:${F}px" role="group" aria-label="${esc(aria)}" data-rove>${axis}${noteSvg}${leadSvg}<g class="rp-dots">${dotSvg}</g>${labelSvg}</svg>`;
}

/** The page title: how many benchmarks labs named, and how many of them only one lab named. */
export function heroHead(d: RData, v: View): string {
  const m = swarmRows(d, v);
  const once = m.rows.filter((r) => r.labs === 1).length;
  if (!m.rows.length) return `No benchmarks named in ${v.year}`;
  return `Of the ${num(m.rows.length)} benchmarks labs named in ${v.year}, ${num(once)} were named by just one lab`;
}

/** The opening paragraph's numbers. */
export function heroLede(d: RData, v: View): string {
  const s = d.sources[v.year] ?? { posts: 0, docs: 0 };
  return `We counted every benchmark named in the ${num(s.posts)} launch posts labs published in ${v.year}, and in the ${num(s.docs)} system cards, model cards and technical reports published with them. Each shape below is one benchmark. The more labs named it, the further right it sits, and the more releases named it, the bigger it is.`;
}

/** The lookup table's heading: the benchmark the most labs named. */
export function lookupHead(d: RData, v: View): string {
  const m = matrix(d, { ...v, names: 'grouped', min: 1, q: '', sort: 'labs' });
  const lead = m.passing[0];
  if (!lead) return `No benchmarks named in ${v.year}`;
  const tied = m.passing.filter((r) => r.labs === lead.labs);
  if (tied.length === 1) return `${lead.name} was named by ${lead.labs} of the ${m.totalLabs} labs that published scores in ${v.year}`;
  const names = tied.length > 2 ? `${tied.length} benchmarks` : tied.map((r) => r.name).join(' and ');
  return `${names} were each named by ${lead.labs} of the ${m.totalLabs} labs that published scores in ${v.year}`;
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
        for (let k = 0; k < cells[ai]; k++, i++) marks.push(shape(a, (i % 10) * P + P / 2, Math.floor(i / 10) * P + P / 2, 4.3));
        return `<g data-tv="${pct(counts[ai] / h.uses)}" data-tn="${esc(areaName.get(a) ?? a)}" data-ts="${counts[ai]} of the ${h.uses} benchmarks ${esc(lab.name)} named across its releases">${marks.join('')}</g>`;
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
    const moved = AREA_ORDER.map((a) => ({ a, from: then[a] ?? 0, to: now[a] ?? 0 })).sort((x, y) => Math.abs(y.to - y.from) - Math.abs(x.to - x.from))[0];
    if (moved && Math.round(moved.to * 100) !== Math.round(moved.from * 100))
      return `${name(moved.a)} ${moved.to > moved.from ? 'rose' : 'fell'} from ${pct(moved.from)} of what labs reported in ${prevYear} to ${pct(moved.to)} in ${v.year}`;
  }
  const topA = Object.entries(now).sort((a, b) => b[1] - a[1])[0];
  return topA ? `${name(topA[0])} made up ${pct(topA[1])} of what labs reported in ${v.year}, more than any other area` : `What each lab reported in ${v.year}`;
}

/** The lab section's paragraph. */
export function printsLede(d: RData, v: View): string {
  const n = printLabs(d, v).length;
  return `What each of the ${n} labs with the most releases named in ${v.year}, by area. Each grid has 100 shapes, one for every 1% of the benchmarks the lab named across its releases. Labs with similar mixes sit side by side. "Their own" is the share the lab made itself, alone or with others, and "Shared" is the share that at least three other labs also named that year.`;
}
