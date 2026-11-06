// The link-preview films: three charts from the almanac, drawn at 1200 by 630 so a frame can be filmed
// as it is. scripts/og-film.ts films them from the dev-only page Film.astro and writes public/og/.
// Every scene shares one time axis, January 2023 to the data date, so one draw front can reveal it.
import { AS_OF, benchmarks, eciByModel, labById, models } from '../lib/data.ts';
import { leaderRows } from '../lib/leaders.ts';
import { eciReigns } from '../lib/reigns.ts';
import { areaOf } from '../lib/taxonomy.ts';
import { labColor, LAB_SLOTS } from '../lib/palette.ts';

export const SCENES = ['rise', 'index', 'reigns'] as const;
export type SceneId = (typeof SCENES)[number];

export const W = 1200;
export const H = 630;
/** The chart box every scene draws in. */
export const BOX = { x0: 64, x1: 1136, y0: 204, y1: 508 };
export const FROM = '2023-01-01';

export interface Scene {
  id: SceneId;
  /** The title, with <em> for the one italic word the page's own heading uses. */
  title: string;
  subtitle: string;
  /** What the counter counts, and its final value. */
  unit: string;
  total: number;
  /** x of each counted item, sorted, so the counter can count the ones the front has passed. */
  starts: number[];
  /** SVG revealed by the moving front: lines and filled areas. */
  reveal: string;
  /** SVG marks that pop in when the front reaches their data-x. */
  dots: string;
  /** SVG that fades in once the drawing ends: direct labels. */
  end: string;
  /** Left and right edges of the front, when a scene keeps a label column. */
  front: [number, number];
  legend: { label: string; color: string; shape?: string }[];
}

const t0 = Date.parse(FROM);
const t1 = Date.parse(AS_OF);
const xAt = (d: string, x0 = BOX.x0, x1 = BOX.x1) => x0 + (Math.max(0, Math.min(1, (Date.parse(d) - t0) / (t1 - t0))) * (x1 - x0));
const n1 = (v: number) => v.toFixed(1);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// the area shapes from AreaMark.astro, on a 10 by 10 grid
const AREA_SHAPES: Record<string, string> = {
  knowledge: '<circle cx="5" cy="5" r="4.6"/>',
  reasoning: '<path d="M5 .6 9.6 9H.4z"/>',
  code: '<rect x=".8" y=".8" width="8.4" height="8.4" rx="1.2"/>',
  agents: '<path d="M5 .2 9.8 5 5 9.8.2 5z"/>',
  work: '<path d="M5 .4 9 2.7v4.6L5 9.6 1 7.3V2.7z"/>',
  multimodal: '<path d="M5 .3l1.4 3 3.3.4-2.4 2.3.6 3.3L5 7.7 2.1 9.3l.6-3.3L.3 3.7l3.3-.4z"/>',
  safety: '<path d="M3.4.6h3.2v2.8h2.8v3.2H6.6v2.8H3.4V6.6H.6V3.4h2.8z"/>',
};
// short area names: the legend has one line at 1200 px
const AREA_SHORT: [string, string][] = [
  ['knowledge', 'Knowledge'],
  ['reasoning', 'Math and science'],
  ['code', 'Coding'],
  ['agents', 'Agents'],
  ['work', 'Work'],
  ['multimodal', 'Vision and audio'],
  ['safety', 'Safety'],
];

/** The home page's drawing: one line per benchmark, its best score since 2023, colored by area. */
function rise(): Scene {
  const { x0, x1, y0, y1 } = BOX;
  const y = (v: number) => y1 - (Math.max(0, Math.min(100, v)) / 100) * (y1 - y0);
  const bench = new Map(benchmarks.map((b) => [b.id, b]));
  const rows = leaderRows(
    benchmarks.map((b) => b.id),
    'all',
    5000,
  );
  // the same lines as HeroArt.astro: benchmarks that arrived after the start of 2023, higher is better
  const lines = rows
    .map((r) => {
      const steps = r.reigns.flatMap((g) => g.steps).sort((a, b) => a.date.localeCompare(b.date));
      if (steps.length < 2 || steps[0].date < FROM || bench.get(r.benchmark)?.better === 'lower') return null;
      const end = r.replacedBy?.date && r.replacedBy.date < r.lastTested ? r.replacedBy.date : r.lastTested;
      const pts = steps.map((s) => [xAt(s.date), y(s.value)] as const);
      const ex = xAt(end);
      if (ex > pts.at(-1)![0] + 1) pts.push([ex, pts.at(-1)![1]]);
      let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        if (Math.abs(by - ay) < 0.5) {
          d += `H${n1(bx)}`;
          continue;
        }
        const m = (ax + bx) / 2;
        d += `C${n1(m)} ${n1(ay)} ${n1(m)} ${n1(by)} ${n1(bx)} ${n1(by)}`;
      }
      return { d, area: areaOf(bench.get(r.benchmark)!.category), x: pts[0][0] };
    })
    .filter((l) => !!l);
  return {
    id: 'rise',
    title: 'AI benchmarks and who <em>leads</em> them',
    subtitle: 'We drew each benchmark’s best score since 2023 as one line, colored by area.',
    unit: 'benchmarks',
    total: lines.length,
    starts: lines.map((l) => l.x).sort((a, b) => a - b),
    reveal: `<g fill="none" stroke-width="1.6" stroke-opacity="0.5" stroke-linejoin="round" stroke-linecap="round">${lines
      .map((l) => `<path d="${l.d}" stroke="var(--area-${l.area})"/>`)
      .join('')}</g>`,
    dots: '',
    end: '',
    front: [x0, x1],
    legend: AREA_SHORT.map(([id, label]) => ({ label, color: `var(--area-${id})`, shape: AREA_SHAPES[id] })),
  };
}

// a lab legend in the palette's tested order, then xAI and the gray for everyone else
function labLegend(present: Set<string | undefined>) {
  const slots = [...LAB_SLOTS, 'xai'].filter((l) => present.has(l));
  const named = new Set<string>(slots);
  const short: Record<string, string> = { google: 'Google', moonshot: 'Moonshot' };
  return [
    ...slots.map((l) => ({ label: short[l] ?? labById.get(l)?.name ?? l, color: labColor(l) })),
    ...([...present].some((l) => !l || !named.has(l)) ? [{ label: 'Other labs', color: labColor(undefined) }] : []),
  ];
}

/** The capability index over time, after the models page: one dot per model, a step line for the best so far. */
function index(): Scene {
  const { x0, x1, y0, y1 } = BOX;
  const pts = models
    .filter((m) => eciByModel.has(m.id) && m.released && m.released >= FROM && m.released <= AS_OF)
    .map((m) => ({ m, x: xAt(m.released!), v: eciByModel.get(m.id)!.eci }))
    .sort((a, b) => a.x - b.x || a.v - b.v);
  const lo = Math.floor(Math.min(...pts.map((p) => p.v)) / 10) * 10;
  const hi = Math.ceil(Math.max(...pts.map((p) => p.v)) / 10) * 10;
  const y = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
  // the frontier: each model that beat every earlier one
  const frontier: typeof pts = [];
  for (const p of pts) if (!frontier.length || p.v > frontier.at(-1)!.v) frontier.push(p);
  let d = `M${n1(frontier[0].x)} ${n1(y(frontier[0].v))}`;
  for (const p of frontier.slice(1)) d += `H${n1(p.x)}V${n1(y(p.v))}`;
  d += `H${n1(x1)}`;
  const onFront = new Set(frontier.map((p) => p.m.id));
  // Direct labels, newest frontier model first. Each sits above and to the left of its dot: every earlier
  // model scored lower, so nothing is drawn there. Skip a label that would sit on one already placed.
  const placed: { x: number; y: number; w: number }[] = [];
  const labels: string[] = [];
  for (const p of [...frontier].reverse()) {
    if (labels.length >= 3) break;
    const text = p.m.name;
    const w = text.length * 8.4 + 48;
    const lx = p.x - 8;
    const ly = y(p.v) - 11;
    if (lx - w < x0 + 40) break;
    if (placed.some((q) => Math.abs(q.y - ly) < 22 && lx - w < q.x && lx > q.x - q.w)) continue;
    placed.push({ x: lx, y: ly, w });
    const first = labels.length === 0;
    labels.push(
      `<text x="${n1(lx)}" y="${n1(ly)}" text-anchor="end" class="lab${first ? ' lead' : ''}">${esc(text)}<tspan class="v" dx="7">${p.v.toFixed(1)}</tspan></text>`,
    );
  }
  const ticks = [lo, ...Array.from({ length: 3 }, (_, i) => Math.round(lo + ((i + 1) * (hi - lo)) / 4)), hi];
  return {
    id: 'index',
    title: 'The models at the top',
    subtitle: 'Epoch AI’s Capabilities Index by release date. The line marks the best so far.',
    unit: 'models',
    total: pts.length,
    starts: pts.map((p) => p.x),
    reveal:
      ticks.map((v) => `<text x="${x0 - 10}" y="${n1(y(v) + 4)}" class="ytick" text-anchor="end">${v}</text>`).join('') +
      `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>`,
    dots: pts
      .map(
        (p) =>
          `<circle cx="${n1(p.x)}" cy="${n1(y(p.v))}" r="0" data-x="${n1(p.x)}" data-r="${onFront.has(p.m.id) ? 6.5 : 5}" fill="${labColor(p.m.lab)}" stroke="var(--bg)" stroke-width="1.5"/>`,
      )
      .join(''),
    end: labels.join(''),
    front: [x0, x1],
    legend: labLegend(new Set(pts.map((p) => p.m.lab))),
  };
}

/** Who held number one: the home page's capability index and math rows, colored by the leading lab. */
function reigns(): Scene {
  // a column for benchmark names on the left and one for today's leader on the right
  const L0 = 284;
  const L1 = 916;
  const { y0, y1 } = BOX;
  const mathIds = benchmarks.filter((b) => b.category === 'math').map((b) => b.id);
  const eci = eciReigns();
  const rows = [...(eci ? [eci] : []), ...leaderRows(mathIds, 'all', 6)];
  const names = new Map(benchmarks.map((b) => [b.id, b.name]));
  const gap = 10;
  const rh = (y1 - y0 - gap * (rows.length - 1)) / rows.length;
  const x = (d: string) => xAt(d, L0, L1);
  const reveal: string[] = [];
  const end: string[] = [];
  const starts: number[] = [];
  const present = new Set<string | undefined>();
  rows.forEach((r, i) => {
    const top = y0 + i * (rh + gap);
    const base = top + rh;
    const [lo, hi] = r.domain;
    const yv = (v: number) => base - Math.max(0.08, Math.min(1, (v - lo) / (hi - lo || 1))) * rh;
    const label = r.benchmark === 'eci' ? 'Capabilities Index' : (names.get(r.benchmark) ?? r.benchmark);
    reveal.push(`<line x1="${L0}" x2="${L1}" y1="${n1(base)}" y2="${n1(base)}" class="base"/>`);
    const shown = r.reigns.filter((g) => g.end > FROM);
    shown.forEach((g, j) => {
      present.add(g.lab);
      const steps = [...g.steps].sort((a, b) => a.date.localeCompare(b.date));
      const sx = x(g.start > FROM ? g.start : FROM);
      // each stretch runs a little under the next one, so no hairline of page shows between them
      const ex = x(g.end) + (j < shown.length - 1 ? 0.8 : 0);
      if (ex - sx < 0.5) return;
      if (g.start >= FROM) starts.push(sx);
      let d = `M${n1(sx)} ${n1(base)}V${n1(yv(steps[0].value))}`;
      for (const s of steps.slice(1)) if (s.date > g.start) d += `H${n1(Math.min(ex, x(s.date)))}V${n1(yv(s.value))}`;
      d += `H${n1(ex)}V${n1(base)}Z`;
      reveal.push(`<path d="${d}" fill="${labColor(g.lab)}" fill-opacity="0.9"/>`);
    });
    const now = shown.at(-1);
    const who = now ? (models.find((m) => m.id === now.model)?.name ?? now.model) : '';
    reveal.push(`<text x="${L0 - 14}" y="${n1(base - rh / 2 + 5)}" text-anchor="end" class="row">${esc(label)}</text>`);
    // Film.astro trims a name longer than the column, data-w wide
    if (who) end.push(`<text x="${L1 + 16}" y="${n1(base - rh / 2 + 5)}" class="who" data-w="${BOX.x1 - L1 - 16}">${esc(who)}</text>`);
  });
  return {
    id: 'reigns',
    title: 'Who held number one',
    subtitle: 'The capability index and the most-used math benchmarks since 2023. Color is the leading lab, and taller means a higher score.',
    unit: 'new leaders',
    total: starts.length,
    starts: starts.sort((a, b) => a - b),
    reveal: reveal.join(''),
    dots: '',
    end: end.join(''),
    front: [L0, L1],
    legend: labLegend(present),
  };
}

export function scene(id: string): Scene {
  if (id === 'index') return index();
  if (id === 'reigns') return reigns();
  return rise();
}

/** January 1st of each year inside the axis, for the tick row under the chart. */
export function yearTicks(x0 = BOX.x0, x1 = BOX.x1): { x: number; label: string }[] {
  const out: { x: number; label: string }[] = [];
  for (let y = 2023; `${y}-01-01` <= AS_OF; y++) out.push({ x: xAt(`${y}-01-01`, x0, x1), label: String(y) });
  return out;
}

export { AS_OF };
