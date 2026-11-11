// The link-preview films: charts from the almanac, drawn at 1200 by 630 so a frame can be filmed as it is.
// scripts/og-film.ts films them from the dev-only page Film.astro and writes public/og/. A moving front
// reveals each chart from left to right. Most scenes run on time since January 2023. The pace scene runs on
// months since a benchmark's release, and the reporting scene on the number of labs that named a benchmark.
import { AS_OF, allSummaries, benchmarks, eciByModel, labById, models, SATURATED } from '../lib/data.ts';
import { leaderRows } from '../lib/leaders.ts';
import { eciReigns } from '../lib/reigns.ts';
import { areaOf } from '../lib/taxonomy.ts';
import { labColor, LAB_SLOTS } from '../lib/palette.ts';
import { reportingData, currentYear } from '../lib/reporting.ts';
import { DEFAULT_VIEW } from '../lib/reporting-view.ts';
import { swarmSvg, heroHead, symbolsSvg, type SwarmOpts } from '../lib/reporting-graphics.ts';
import { buildPayload } from '../lib/build-data.ts';
import { LAYERS, monthsSince, ridgePaths } from '../lib/ridge.ts';
import { Matrix, compute, defaultNeed, headline, type State } from '../lib/build-index.ts';

export const SCENES = ['ridge', 'rise', 'index', 'reigns', 'pace', 'reporting', 'build'] as const;
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
  /** What the counter counts, and its final value. A scene without a total has no counter. */
  unit?: string;
  total?: number;
  /** Top and bottom of the chart, for the cursor, when not BOX's. */
  box?: { y0: number; y1: number };
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
  legend: { label: string; color: string; shape?: string; line?: boolean }[];
  /** Title size in px, when the title is a long finding. 56 otherwise. */
  titleSize?: number;
  /** Where the subtitle starts, under a title of two lines. 124 otherwise. */
  subTop?: number;
  /** The tick row under the chart, when the axis is not years. */
  ticks?: { x: number; label: string }[];
  /** What the cursor reads at each point the front passes, when it is not a month and year. */
  stops?: { x: number; label: string }[];
  /** SVG that never moves: axes and tick labels. */
  fixed?: string;
  /** Symbol definitions the marks use. */
  defs?: string;
  /** The build scene has no front: its weights shift and its ranking reorders (Film.astro, rank mode). */
  rank?: RankFilm;
}

export interface RankFilm {
  /** One per weighting the film visits. The film starts and ends on the first. */
  states: { caption: string; shares: number[]; rank: number[]; value: number[] }[];
  /** Rows on show at once. */
  rows: number;
  /** The value a full bar stands for. */
  max: number;
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

/** The site's preview: the footer's landscape at full width. Benchmarks released each month since 2019, stacked
 * by area and drawn as an even grid of dots in each area's color (src/lib/ridge.ts). The counter counts every
 * benchmark the front passes. The title compares this year's count with the earliest years it beats combined. */
function ridge(): Scene {
  const { y0, y1 } = BOX;
  const months = monthsSince();
  const at = new Map(months.map((m, i) => [m, i]));
  const x = (i: number) => (i / (months.length - 1)) * W;
  const paths = ridgePaths(W, y1 - y0);
  // the top area first, and each area below covers it, as in the footer: a faint wash, then the dots
  const bands = [...LAYERS]
    .reverse()
    .map((id) => `<path d="${paths.get(id)}" style="fill:color-mix(in srgb, var(--area-${id}) 9%, var(--bg))"/><path d="${paths.get(id)}" fill="url(#ridge-${id})"/>`)
    .join('');
  const defs = LAYERS.map(
    (id) => `<pattern id="ridge-${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="var(--area-${id})"/></pattern>`,
  ).join('');
  const starts: number[] = [];
  const perYear = new Map<number, number>();
  for (const b of benchmarks) {
    const i = at.get(b.released?.slice(0, 7) ?? '');
    if (i === undefined) continue;
    starts.push(x(i));
    const y = Number(months[i].slice(0, 4));
    perYear.set(y, (perYear.get(y) ?? 0) + 1);
  }
  starts.sort((a, b) => a - b);
  // "2026 brought more AI benchmarks than 2019 to 2024 combined": the latest year with whole months, against
  // the longest run of years from 2019 whose sum it still beats
  const first = Number(months[0].slice(0, 4));
  const last = Number(months.at(-1)!.slice(0, 4));
  const now = perYear.get(last) ?? 0;
  let upTo = 0;
  let sum = 0;
  for (let y = first; y < last; y++) {
    sum += perYear.get(y) ?? 0;
    if (sum < now) upTo = y;
    else break;
  }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    id: 'ridge',
    title: upTo > first ? `${last} brought more AI benchmarks than ${first} to ${upTo} combined` : `AI benchmarks released each month since ${first}`,
    subtitle: `Benchmarks released each month since ${first}, colored by area.`,
    unit: `benchmarks since ${first}`,
    total: starts.length,
    starts,
    reveal: `<g transform="translate(0 ${y0})">${bands}</g>`,
    dots: '',
    end: '',
    defs,
    front: [0, W],
    ticks: months.flatMap((m, i) => (m.endsWith('-01') ? [{ x: x(i), label: m.slice(0, 4) }] : [])),
    stops: months.map((m, i) => ({ x: x(i), label: `${MON[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}` })),
    legend: AREA_SHORT.map(([id, label]) => ({ label, color: `var(--area-${id})`, shape: AREA_SHAPES[id] })),
    titleSize: 44,
    subTop: 152,
  };
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
  // each benchmark from the one source its page leads with, as on /leaders/
  const rows = [...(eci ? [eci] : []), ...leaderRows(mathIds, 'headline', 6)];
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
      reveal.push(`<path d="${d}" fill="${labColor(g.lab)}"/>`);
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

/**
 * The home page's film: how soon a model passes 85% on a new benchmark, for the benchmarks released in each of the
 * last three full years. One line per release year, by months since each benchmark came out. A Kaplan-Meier
 * estimate, so a benchmark no model has passed yet counts as still open, not as a miss. Only the first year shows:
 * that is where the years differ, and the youngest year has about a year of history.
 */
function pace(): Scene {
  const x0 = 120;
  const L1 = 930;
  const y0 = 262;
  const y1 = BOX.y1;
  const last = Number(AS_OF.slice(0, 4)) - 1;
  const years = [last - 2, last - 1, last];
  const MONTH = 30.4375 * 864e5;
  const day = (d: string) => Date.parse(d.length === 4 ? `${d}-07-01` : d.length === 7 ? `${d}-01` : d);
  // the benchmarks labs report: named in three or more launch posts, scored in percent, higher is better
  const pool = allSummaries().filter((s) => s.cites.length >= 3 && s.b.released && (s.b.unit ?? '%') === '%' && s.b.better !== 'lower');
  const curves = years.map((yr) => {
    const items = pool
      .filter((s) => s.b.released!.startsWith(String(yr)))
      .map((s) => {
        const from = day(s.b.released!);
        const hit = s.frontier.find((p) => p.value >= SATURATED);
        // a model scored before the benchmark's release date counts as passing it at release
        return hit ? { t: Math.max(0, (Date.parse(hit.date) - from) / MONTH), hit: true } : { t: (Date.parse(AS_OF) - from) / MONTH, hit: false };
      });
    const times = [...new Set(items.filter((i) => i.hit).map((i) => i.t))].filter((t) => t <= 12).sort((a, b) => a - b);
    let open = 1;
    const pts: [number, number][] = [[0, 0]];
    for (const t of times) {
      const atRisk = items.filter((i) => i.t >= t).length;
      const passed = items.filter((i) => i.hit && i.t === t).length;
      open *= 1 - passed / atRisk;
      pts.push([t, 1 - open]);
    }
    return { yr, n: items.length, pts, end: pts.at(-1)![1] };
  });
  const top = Math.max(0.1, Math.ceil(Math.max(...curves.map((c) => c.end)) * 10) / 10);
  const x = (m: number) => x0 + (Math.min(12, m) / 12) * (L1 - x0);
  const y = (v: number) => y1 - (v / top) * (y1 - y0);
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const ink = ['var(--ink-4)', 'var(--ink-3)', 'var(--ink)'];
  const path = (pts: [number, number][]) => {
    let d = `M${n1(x(0))} ${n1(y(0))}`;
    for (const [t, v] of pts) d += `H${n1(x(t))}V${n1(y(v))}`;
    return `${d}H${n1(x(12))}`;
  };
  const newest = curves.at(-1)!;
  const reveal = [
    `<path d="${path(newest.pts)}V${n1(y(0))}H${n1(x(0))}Z" fill="var(--ink)" fill-opacity="0.05"/>`,
    ...curves.map((c, i) => `<path d="${path(c.pts)}" fill="none" stroke="${ink[i]}" stroke-width="${i === 2 ? 4 : 3}" stroke-linejoin="round"/>`),
  ].join('');
  // labels at the end of each line, pushed apart so two close lines keep both labels
  const ends = curves.map((c, i) => ({ c, i, y: y(c.end) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 30);
  const end = ends
    .map(
      ({ c, i, y: ly }) =>
        `<circle cx="${n1(x(12))}" cy="${n1(y(c.end))}" r="6" fill="${ink[i]}" stroke="var(--bg)" stroke-width="2"/>` +
        `<text x="${n1(x(12) + 18)}" y="${n1(ly + 7)}" class="pv${i === 2 ? ' lead' : ''}">${pct(c.end)}<tspan class="py" dx="9">${c.yr}</tspan></text>`,
    )
    .join('');
  const yt = Array.from({ length: Math.round(top * 10) + 1 }, (_, k) => k / 10);
  const fixed = yt
    .map((v) => `<line x1="${x0}" x2="${n1(x(12))}" y1="${n1(y(v))}" y2="${n1(y(v))}" class="${v ? 'hgrid' : 'base'}"/><text x="${x0 - 14}" y="${n1(y(v) + 5)}" class="ytick" text-anchor="end">${pct(v)}</text>`)
    .join('');
  const monthLabel = (m: number) => (m === 0 ? 'Release' : m === 12 ? '1 year' : `${m} month${m === 1 ? '' : 's'}`);
  const rising = curves.every((c, i) => !i || c.end > curves[i - 1].end);
  const [a, b] = curves;
  const n = curves.reduce((s, c) => s + c.n, 0);
  return {
    id: 'pace',
    title: `A model passed 85% on ${pct(newest.end)} of ${newest.yr}’s benchmarks within a year`,
    subtitle: `${rising ? 'Up from' : 'Against'} ${pct(b.end)} of ${b.yr}’s and ${pct(a.end)} of ${a.yr}’s, across the ${n} benchmarks from those years that labs named in three or more launch posts.`,
    titleSize: 50,
    subTop: 166,
    starts: [],
    reveal,
    dots: '',
    end,
    fixed,
    front: [x0, L1],
    box: { y0, y1 },
    ticks: [0, 3, 6, 9, 12].map((m) => ({ x: x(m), label: monthLabel(m) })),
    stops: Array.from({ length: 13 }, (_, m) => ({ x: x(m), label: monthLabel(m) })),
    legend: curves.map((c, i) => ({ label: `Released in ${c.yr}`, color: ink[i], line: true })),
  };
}

/**
 * The reporting page's film: its beeswarm of every benchmark labs named this year, one shape each, placed by how
 * many labs named it. The shapes arrive from left to right, so the long tail of benchmarks one lab named fills first.
 * It draws with the page's own code (reporting-graphics.ts) and lifts the shapes out so each can pop in.
 */
function reporting(): Scene {
  const d = reportingData();
  const v = DEFAULT_VIEW(currentYear());
  const o: SwarmOpts = { key: 'wide', orient: 'h', W: 1072, len: 990, rk: 2.15, rMax: 22, font: 15, labels: 6 };
  const svg = swarmSvg(d, v, o);
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) throw new Error('The reporting swarm drew nothing');
  const [vw, vh] = [Number(vb[1]), Number(vb[2])];
  const top = 200;
  const bottom = 556;
  const s = Math.min((BOX.x1 - BOX.x0) / vw, (bottom - top) / vh);
  const X = BOX.x0;
  const Y = bottom - vh * s;
  const inner = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/<a [^>]*>|<\/a>/g, '');
  const tags = inner.match(/<text\b[^>]*>.*?<\/text>|<(?:line|path|use)\b[^>]*\/>/g) ?? [];
  const fixed: string[] = [];
  const end: string[] = [];
  const dots: string[] = [];
  const starts: number[] = [];
  const stops: { x: number; label: string }[] = [];
  const attr = (t: string, k: string) => Number(t.match(new RegExp(`\\b${k}="(-?[\\d.]+)"`))?.[1] ?? 0);
  for (const t of tags) {
    const cls = t.match(/class="([^"]*)"/)?.[1] ?? '';
    if (t.startsWith('<use')) {
      const cx = attr(t, 'x') + attr(t, 'width') / 2;
      const cy = attr(t, 'y') + attr(t, 'height') / 2;
      const ox = X + cx * s;
      starts.push(ox);
      dots.push(t.replace('<use ', `<use data-x="${n1(ox)}" data-cx="${n1(cx)}" data-cy="${n1(cy)}" `));
    } else if (/\brp-(axl|tk|at)\b/.test(cls)) {
      fixed.push(t);
      if (/\brp-tk\b/.test(cls)) {
        const k = t.replace(/<[^>]+>/g, '');
        stops.push({ x: X + attr(t, 'x') * s, label: `${k} ${k === '1' ? 'lab' : 'labs'}` });
      }
    } else end.push(t);
  }
  const g = (parts: string[]) => `<g transform="translate(${n1(X)} ${n1(Y)}) scale(${s.toFixed(4)})">${parts.join('')}</g>`;
  starts.sort((p, q) => p - q);
  return {
    id: 'reporting',
    title: heroHead(d, v),
    subtitle: 'One shape per benchmark, placed by how many labs named it, and sized by how many releases did.',
    titleSize: 44,
    subTop: 152,
    unit: 'benchmarks',
    total: dots.length,
    starts,
    reveal: '',
    dots: g(dots),
    end: g(end),
    fixed: g(fixed),
    defs: symbolsSvg().replace(/^.*?<defs>|<\/defs>.*$/g, ''),
    front: [starts[0] - 24, starts.at(-1)! + 40],
    box: { y0: top + 20, y1: bottom - 30 },
    ticks: [],
    stops: stops.sort((p, q) => p.x - q.x),
    // only the areas drawn: safety evaluations are off by default on the page
    legend: AREA_SHORT.filter(([id]) => dots.some((t) => t.includes(`a-${id}"`))).map(([id, label]) => ({ label, color: `var(--area-${id})`, shape: AREA_SHAPES[id] })),
  };
}

/**
 * The index builder's film: the page's default index (the tests most labs reported this year, weighted equally),
 * then the same tests with one area counted four times, twice, then back. The weight bar shifts first, and then
 * the ranking glides into its new order, so a viewer sees that the weights decide who leads.
 */
function build(): Scene {
  const p = buildPayload();
  const mx = new Matrix(p);
  const preset = p.presets[0];
  const base: State = { b: preset.b.map((id) => ({ id, w: 50 })), src: 'all', need: defaultNeed(preset.b.length) };
  const first = compute(mx, base);
  const tests = first.used.map((u) => ({ id: u.id, name: p.benches[u.bi][1], area: p.benches[u.bi][2] }));
  const areas = [...new Set(tests.map((t) => t.area))];
  const ROWS = 6;
  // each area counted four times: keep the two whose leaders differ from the start and from each other,
  // else the two that reorder the top rows most
  const tries = areas.map((a) => {
    const st: State = { ...base, b: base.b.map((x) => ({ id: x.id, w: tests.find((t) => t.id === x.id)?.area === a ? 100 : 25 })) };
    const res = compute(mx, st);
    const moved = res.rows.slice(0, ROWS).filter((r, i) => first.rows[i]?.m !== r.m).length;
    return { a, res, lead: res.rows[0]?.m, moved, n: tests.filter((t) => t.area === a).length };
  });
  const picked: typeof tries = [];
  for (const t of [...tries].sort((x, y) => y.moved - x.moved || y.n - x.n))
    if (t.lead !== first.rows[0]?.m && !picked.some((q) => q.lead === t.lead)) picked.push(t);
  for (const t of [...tries].sort((x, y) => y.moved - x.moved || y.n - x.n)) if (picked.length < 2 && !picked.includes(t)) picked.push(t);
  const AREA_LABEL: Record<string, string> = { knowledge: 'Knowledge', reasoning: 'Math and science', code: 'Coding', agents: 'Agent', work: 'Work', multimodal: 'Vision and audio', safety: 'Safety' };
  const runs = [{ caption: 'Equal weights', res: first }, ...picked.slice(0, 2).map((t) => ({ caption: `${AREA_LABEL[t.a] ?? t.a} tests count four times`, res: t.res }))];
  // every model that reaches the shown rows in any weighting gets a row, in its first weighting's place
  const ids = [...new Set(runs.flatMap((r) => r.res.rows.slice(0, ROWS).map((x) => x.m)))];
  const states = runs.map((r) => {
    const at = new Map(r.res.rows.map((x, i) => [x.m, i]));
    const val = new Map(r.res.rows.map((x) => [x.m, x.value]));
    const shares = tests.map((t) => r.res.used.find((u) => u.id === t.id)?.share ?? 0);
    return { caption: r.caption, shares, rank: ids.map((m) => at.get(m) ?? ROWS + 2), value: ids.map((m) => Math.round((val.get(m) ?? 0) * 10) / 10) };
  });
  const max = Math.ceil(Math.max(...states.flatMap((s) => s.value)) / 10) * 10;
  // the marks: the weight bar's segments and one row per model, placed by the script
  const { x0, x1 } = BOX;
  const segs = tests
    .map(
      (t, i) =>
        `<g data-seg="${i}"><rect y="236" height="44" rx="4" fill="var(--area-${t.area})" fill-opacity="0.16"/><rect y="236" height="5" rx="2" fill="var(--area-${t.area})"/><text y="265" class="seg" data-full="${esc(t.name)}">${esc(t.name)}</text></g>`,
    )
    .join('');
  const rowsSvg = ids
    .map((m, j) => {
      const [, name, lab] = p.models[m];
      return `<g data-row="${j}"><text x="${x0}" y="0" class="rk"></text><circle cx="${x0 + 40}" cy="-6" r="6" fill="${labColor(lab)}"/><text x="${x0 + 56}" y="0" class="nm">${esc(name)}</text><rect x="${x0 + 360}" y="-17" height="22" rx="3" fill="${labColor(lab)}"/><text y="0" class="val"></text></g>`;
    })
    .join('');
  return {
    id: 'build',
    title: headline(p, first),
    subtitle: `${preset.name}, weighted equally. Change the weights and the order changes.`,
    titleSize: 44,
    subTop: 152,
    starts: [],
    reveal: '',
    dots: '',
    end: '',
    fixed: `<text x="${x0}" y="222" class="cap" data-cap></text>${segs}<g class="rows">${rowsSvg}</g>`,
    front: [x0, x1],
    ticks: [],
    rank: { states, rows: ROWS, max },
    legend: AREA_SHORT.filter(([id]) => areas.includes(id)).map(([id, label]) => ({ label, color: `var(--area-${id})`, shape: AREA_SHAPES[id] })),
  };
}

export function scene(id: string): Scene {
  if (id === 'ridge') return ridge();
  if (id === 'index') return index();
  if (id === 'reigns') return reigns();
  if (id === 'pace') return pace();
  if (id === 'reporting') return reporting();
  if (id === 'build') return build();
  return rise();
}

/** January 1st of each year inside the axis, for the tick row under the chart. */
export function yearTicks(x0 = BOX.x0, x1 = BOX.x1): { x: number; label: string }[] {
  const out: { x: number; label: string }[] = [];
  for (let y = 2023; `${y}-01-01` <= AS_OF; y++) out.push({ x: xAt(`${y}-01-01`, x0, x1), label: String(y) });
  return out;
}

export { AS_OF };
