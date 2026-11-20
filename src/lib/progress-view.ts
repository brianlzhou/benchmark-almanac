// The Progress page: several benchmarks' best score so far on one chart, by the release date of the model that set
// each one. progress-data.ts builds the data on the server (a benchmark list for the picker, and one small file per
// benchmark with its record steps from each source). This file holds the math and the markup, so the server render
// and the page script draw the same thing. Every name is escaped.
import { score } from './format.ts';

export type Pool = 'headline' | 'independent' | 'all';
export type Range = '6m' | '1y' | '2y' | 'all';
export const POOLS: Pool[] = ['headline', 'independent', 'all'];
export const RANGES: Range[] = ['6m', '1y', '2y', 'all'];
export const MAX_PICKS = 8;
export const DEFAULT_TITLE = 'Model progress over time';

/**
 * Series colors: the eight hues of the site's validated categorical palette, in its tested order (blue, orange,
 * aqua, yellow, magenta, green, violet, red). The tokens carry lab names because labs use the same palette. A
 * benchmark keeps its slot while others come and go, so its color never changes when another is removed.
 */
export const SERIES = ['openai', 'anthropic', 'google', 'moonshot', 'meta', 'deepseek', 'qwen', 'zai'].map((l) => `var(--lab-${l})`);

/** [day, best score, index into `models`, where it came from (an index into ORIGINS)] */
export type Step = [string, number, number, number];
/** Where a record came from, as the tooltip says it. The last two are labs' own numbers, drawn as rings. */
export const ORIGINS = ['On the official leaderboard', 'Run by Epoch AI', 'On another leaderboard, collected by Epoch AI', 'The lab’s own number', 'A claim Epoch AI collected from a report or paper'];
export const isClaimStep = (st: Step) => st[3] >= 3;
export interface PoolLine {
  /** What the source is, as the benchmark page's switch names it. */
  label: string;
  steps: Step[];
  /** The release day of the newest model this source scored, where the line stops. */
  last: string;
}
export interface ProgressFile {
  v: 1;
  id: string;
  name: string;
  maker: string;
  unit: string;
  better: 'higher' | 'lower';
  pools: Partial<Record<Pool, PoolLine>>;
  /** [model id, name] */
  models: [string, string][];
}
/** The picker's list: [id, name, other names joined with " | ", unit, maker, models scored] */
export type IndexRow = [string, string, string, string, string, number];
export interface ProgressIndex {
  asOf: string;
  rows: IndexRow[];
}

export interface State {
  /** Picks by color slot. An empty slot is a benchmark the reader removed. */
  b: (string | null)[];
  range: Range;
  pool: Pool;
  title: string;
}
export const DEFAULT_STATE: Omit<State, 'b'> = { range: '1y', pool: 'headline', title: DEFAULT_TITLE };

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- the address ---------------------------------------------------------------------------------------
export function readState(search: string, fallback: State, known: (id: string) => boolean): State {
  const q = new URLSearchParams(search);
  const b = q.get('b');
  const range = q.get('range') as Range;
  const pool = q.get('pool') as Pool;
  const picks = b === null ? fallback.b : b.split(',').map((x) => (x && known(x) ? x : null)).slice(0, MAX_PICKS);
  while (picks.length && picks.at(-1) === null) picks.pop();
  return {
    b: picks,
    range: RANGES.includes(range) ? range : fallback.range,
    pool: POOLS.includes(pool) ? pool : fallback.pool,
    title: q.get('t')?.trim().slice(0, 120) || fallback.title,
  };
}
export function writeState(st: State, defaults: State): string {
  const q = new URLSearchParams();
  const b = st.b.map((x) => x ?? '').join(',').replace(/,+$/, '');
  if (b !== defaults.b.join(',')) q.set('b', b);
  if (st.range !== DEFAULT_STATE.range) q.set('range', st.range);
  if (st.pool !== DEFAULT_STATE.pool) q.set('pool', st.pool);
  if (st.title !== DEFAULT_TITLE) q.set('t', st.title);
  const s = q.toString().replace(/%2C/g, ',');
  return s ? `?${s}` : '/progress/';
}

// ---- the series ----------------------------------------------------------------------------------------
const addMonths = (d: string, n: number) => {
  const [y, m] = d.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return t.toISOString().slice(0, 10);
};
export function rangeStart(range: Range, asOf: string, files: ProgressFile[], pool: Pool): string {
  if (range === '6m') return addMonths(asOf, -6);
  if (range === '1y') return addMonths(asOf, -12);
  if (range === '2y') return addMonths(asOf, -24);
  const first = files.map((f) => lineOf(f, pool)?.steps[0]?.[0]).filter((d): d is string => !!d).sort()[0];
  return first ? `${first.slice(0, 7)}-01` : addMonths(asOf, -12);
}
/** The source a benchmark's line comes from: the one picked, or the page's own when the benchmark lacks it. */
export const lineOf = (f: ProgressFile, pool: Pool): PoolLine | undefined => f.pools[pool] ?? f.pools.headline ?? f.pools.all;

export interface Series {
  f: ProgressFile;
  slot: number;
  color: string;
  line: PoolLine;
  /** The best score when the range opens, carried in from before it, if any. */
  carry?: Step;
  /** The records set inside the range. */
  steps: Step[];
  /** Where the line stops: the newest model scored, within the range. */
  end: string;
  /** The best score now, and who holds it. */
  now?: Step;
}
export function seriesOf(st: State, files: Map<string, ProgressFile>, start: string, asOf: string): Series[] {
  const out: Series[] = [];
  st.b.forEach((id, slot) => {
    const f = id ? files.get(id) : undefined;
    const line = f && lineOf(f, st.pool);
    if (!f || !line) return;
    const carry = line.steps.filter((s) => s[0] < start).at(-1);
    const steps = line.steps.filter((s) => s[0] >= start && s[0] <= asOf);
    const now = steps.at(-1) ?? carry;
    const last = [line.last, now?.[0] ?? ''].sort().at(-1)!;
    out.push({ f, slot, color: SERIES[slot % SERIES.length], line, carry, steps, end: last > asOf ? asOf : last, now });
  });
  return out;
}

// ---- words ---------------------------------------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));
const monthYear = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const shortMonth = (d: string) => `${SHORT[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
export const RANGE_LABEL: Record<Range, string> = { '6m': 'Past 6 months', '1y': 'Past year', '2y': 'Past 2 years', all: 'All time' };
const spanWords = (range: Range, start: string) =>
  ({ '6m': 'In the past six months', '1y': 'In the past year', '2y': 'In the past two years', all: `Since ${monthYear(start)}` })[range];
const modelName = (f: ProgressFile, i: number) => f.models[i]?.[1] ?? f.models[i]?.[0] ?? '';
const fmt = (v: number, unit: string) => score(v, unit);

/** The finding under the title: which benchmark improved the most in the range, and who leads it now. */
export function caption(series: Series[], range: Range, start: string): string {
  if (!series.length) return 'Pick a benchmark to see its best score over time.';
  const span = spanWords(range, start);
  const moved = series
    .map((s) => {
      const from = s.carry ?? s.steps[0];
      const sign = s.f.better === 'lower' ? -1 : 1;
      return { s, from, gain: from && s.now ? sign * (s.now[1] - from[1]) : 0 };
    })
    .filter((x) => x.from && x.gain > 0)
    .sort((a, b) => b.gain - a.gain);
  if (!moved.length) return `${span}, none of these benchmarks got a new best score.`;
  const top = moved[0];
  const unit = top.s.f.unit;
  const who = modelName(top.s.f, top.s.now![2]);
  const verb = top.s.f.better === 'lower' ? 'improved' : 'climbed';
  const lead = series.length === 1 ? `the best score on ${top.s.f.name} ${verb}` : `${top.s.f.name} ${verb} the most`;
  return `${span}, ${lead}, from ${fmt(top.from![1], unit)} to ${fmt(top.s.now![1], unit)}. ${who} holds the best score now.`;
}

// ---- the chart -----------------------------------------------------------------------------------------
export interface Size {
  key: 'wide' | 'narrow';
  w: number;
  h: number;
  font: number;
  /** Room on the right for the end labels, or 0 to leave them to the legend. */
  gutter: number;
}
export const SIZES: Size[] = [
  { key: 'wide', w: 1120, h: 520, font: 13, gutter: 236 },
  { key: 'narrow', w: 380, h: 320, font: 11, gutter: 0 },
];

const dayNum = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)) || 1) / 864e5;
function niceStep(span: number, count: number) {
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
}
function yAxis(series: Series[], unit: string, size: Size): { lo: number; hi: number; ticks: number[] } {
  if (unit === '%') return { lo: 0, hi: 100, ticks: Array.from({ length: size.key === 'wide' ? 11 : 6 }, (_, i) => i * (size.key === 'wide' ? 10 : 20)) };
  const vs = series.flatMap((s) => [...(s.carry ? [s.carry[1]] : []), ...s.steps.map((x) => x[1])]);
  if (!vs.length) return { lo: 0, hi: 1, ticks: [0, 1] };
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi === lo) hi = lo + 1;
  const step = niceStep(hi - lo, size.key === 'wide' ? 6 : 4);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, ticks };
}
function monthTicks(start: string, end: string, size: Size): string[] {
  const months = (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(end.slice(5, 7)) - Number(start.slice(5, 7));
  const per = size.key === 'wide' ? (months <= 13 ? 1 : months <= 26 ? 3 : months <= 60 ? 6 : 12) : months <= 7 ? 2 : months <= 13 ? 3 : months <= 26 ? 6 : 12;
  const out: string[] = [];
  let d = `${start.slice(0, 7)}-01`;
  if (d < start) d = addMonths(d, 1);
  // ticks on whole quarters or years when they are that far apart, so they read as Jan, Apr, Jul, Oct
  while ((Number(d.slice(5, 7)) - 1) % per !== 0) d = addMonths(d, 1);
  for (; d <= end; d = addMonths(d, per)) out.push(d);
  return out;
}

/** End labels: placed level with each line's end, then pushed apart so none overlaps the next. */
function spread(ys: number[], gap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = new Array<number>(ys.length);
  let prev = -Infinity;
  for (const o of order) {
    const y = Math.max(o.y, prev + gap, top);
    out[o.i] = y;
    prev = y;
  }
  // pushed past the bottom: walk back up
  let next = Infinity;
  for (const o of [...order].reverse()) {
    const y = Math.min(out[o.i], next - gap, bottom);
    out[o.i] = y;
    next = y;
  }
  return out;
}
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export function chartSvg(series: Series[], start: string, asOf: string, size: Size, label: string): string {
  const { w, h, font, gutter } = size;
  const unit = series[0]?.f.unit ?? '%';
  const pad = { l: size.key === 'wide' ? 48 : 36, r: gutter ? gutter + 14 : 10, t: 14, b: 32 };
  const x0 = dayNum(start);
  const x1 = dayNum(asOf);
  const X = (d: string) => pad.l + ((Math.min(x1, Math.max(x0, dayNum(d))) - x0) / (x1 - x0 || 1)) * (w - pad.l - pad.r);
  const ya = yAxis(series, unit, size);
  const Y = (v: number) => h - pad.b - ((v - ya.lo) / (ya.hi - ya.lo || 1)) * (h - pad.t - pad.b);
  const yFmt = (v: number) => (unit === '%' ? String(v) : fmt(v, unit));
  const parts: string[] = [];
  parts.push(`<svg class="pg-svg only-${size.key}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" style="--f:${font}px">`);
  for (const v of ya.ticks) parts.push(`<line class="grid" x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${pad.l - 8}" y="${Y(v) + 4}" text-anchor="end">${esc(yFmt(v))}</text>`);
  const ticks = monthTicks(start, asOf, size);
  ticks.forEach((d, i) => {
    const showYear = i === 0 || d.slice(5, 7) === '01';
    const t = showYear ? shortMonth(d) : SHORT[Number(d.slice(5, 7)) - 1];
    parts.push(`<line class="vgrid" x1="${X(d)}" x2="${X(d)}" y1="${pad.t}" y2="${h - pad.b}"/><text class="tick" x="${X(d)}" y="${h - 10}" text-anchor="middle">${t}</text>`);
  });
  parts.push(`<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${h - pad.b}" y2="${h - pad.b}"/>`);
  // lines first, then every dot above every line
  const dots: string[] = [];
  const ends: { s: Series; y: number }[] = [];
  for (const s of series) {
    const first = s.carry ? { x: X(start), y: Y(s.carry[1]) } : s.steps[0] ? { x: X(s.steps[0][0]), y: Y(s.steps[0][1]) } : null;
    if (!first) continue;
    let d = `M${first.x},${first.y}`;
    for (const st of s.steps) d += `H${X(st[0])}V${Y(st[1])}`;
    d += `H${X(s.end)}`;
    parts.push(`<path class="pg-line" d="${d}" stroke="${s.color}"/>`);
    for (const st of s.steps) {
      const cx = X(st[0]);
      const cy = Y(st[1]);
      const tip = `data-tv="${esc(fmt(st[1], unit))}" data-tn="${esc(modelName(s.f, st[2]))}" data-ts="${esc(`${s.f.name}. Released ${monthYear(st[0])}. ${ORIGINS[st[3]] ?? s.line.label}.`)}"`;
      dots.push(
        `<g class="pg-pt" ${tip}>${isClaimStep(st) ? `<circle cx="${cx}" cy="${cy}" r="3.6" fill="var(--bg)" stroke="${s.color}" stroke-width="2"/>` : `<circle cx="${cx}" cy="${cy}" r="4.2" fill="${s.color}" stroke="var(--bg)" stroke-width="2"/>`}<circle class="hit" cx="${cx}" cy="${cy}" r="10"/></g>`,
      );
    }
    if (s.now) ends.push({ s, y: Y(s.now[1]) });
  }
  parts.push(...dots);
  if (gutter && ends.length) {
    const ys = spread(
      ends.map((e) => e.y),
      40,
      pad.t + 8,
      h - pad.b - 20,
    );
    const lx = w - pad.r + 16;
    const chars = Math.floor((gutter - 26) / (font * 0.58));
    ends.forEach((e, i) => {
      const y = ys[i];
      parts.push(
        `<g class="pg-end"><line x1="${lx}" x2="${lx + 14}" y1="${y - 4}" y2="${y - 4}" stroke="${e.s.color}" stroke-width="2"/><circle cx="${lx + 14}" cy="${y - 4}" r="3.4" fill="${e.s.color}"/><text class="pg-en" x="${lx + 24}" y="${y}">${esc(clip(e.s.f.name, chars))}</text><text class="pg-el" x="${lx + 24}" y="${y + 17}">${esc(clip(`${modelName(e.s.f, e.s.now![2])} ${fmt(e.s.now![1], unit)}`, chars + 2))}</text></g>`,
      );
    });
  }
  parts.push('</svg>');
  return parts.join('');
}

/** The key over the chart: each benchmark's line and dot, its name, and who made it. */
export function legend(series: Series[]): string {
  return series
    .map(
      (s) =>
        `<li><svg width="22" height="10" aria-hidden="true"><line x1="1" x2="15" y1="5" y2="5" stroke="${s.color}" stroke-width="2"/><circle cx="16" cy="5" r="3.4" fill="${s.color}"/></svg><span>${esc(s.f.name)}${s.f.maker ? ` <span class="muted">(${esc(s.f.maker)})</span>` : ''}</span></li>`,
    )
    .join('');
}

/** The picks as chips, each with its color and a remove button. */
export function chips(st: State, files: Map<string, ProgressFile>, names: Map<string, string>): string {
  return st.b
    .map((id, slot) => {
      if (!id) return '';
      const name = files.get(id)?.name ?? names.get(id) ?? id;
      return `<li class="pg-chip" data-id="${esc(id)}"><span class="pg-dot" style="background:${SERIES[slot % SERIES.length]}"></span><a href="/benchmarks/${esc(id)}/">${esc(name)}</a><button type="button" class="pg-x" data-x="${esc(id)}" aria-label="Remove ${esc(name)}">×</button></li>`;
    })
    .join('');
}

/** One row per benchmark: its best score when the range opens and now, the change, who leads, and how many records fell. */
export function table(series: Series[]): string {
  if (!series.length) return '';
  const rows = series
    .map((s) => {
      const unit = s.f.unit;
      const from = s.carry ?? s.steps[0];
      const change = from && s.now ? s.now[1] - from[1] : 0;
      const ch = !from || !s.now ? '' : change === 0 ? 'No change' : `${change > 0 ? '+' : '−'}${unit === '%' ? `${Math.abs(Math.round(change * 10) / 10)} pts` : fmt(Math.abs(change), unit)}`;
      return `<tr><td><span class="pg-dot" style="background:${s.color}"></span><a href="/benchmarks/${esc(s.f.id)}/">${esc(s.f.name)}</a></td><td class="r num">${from ? esc(fmt(from[1], unit)) : ''}</td><td class="r num">${s.now ? esc(fmt(s.now[1], unit)) : ''}</td><td class="r num">${esc(ch)}</td><td>${s.now ? esc(modelName(s.f, s.now[2])) : ''}</td><td class="r num">${s.steps.length}</td><td class="muted">${esc(s.line.label)}</td></tr>`;
    })
    .join('');
  return `<table class="t pg-t"><thead><tr><th>Benchmark</th><th class="r">At the start</th><th class="r">Now</th><th class="r">Change</th><th>Holds the best score</th><th class="r">New records</th><th>Scores from</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Every record step in the range, for the CSV download. */
export function csv(series: Series[]): string {
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = ['benchmark,benchmark_id,model_release,model,best_score,unit,source'];
  for (const s of series) {
    for (const st of [...(s.carry ? [s.carry] : []), ...s.steps])
      lines.push([s.f.name, s.f.id, st[0], modelName(s.f, st[2]), String(st[1]), s.f.unit, ORIGINS[st[3]] ?? s.line.label].map(q).join(','));
  }
  return lines.join('\n');
}
