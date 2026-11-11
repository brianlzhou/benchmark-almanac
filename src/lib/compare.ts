// The Compare page: two to four models side by side, on every benchmark all of them have a score on. A test that
// any picked model lacks is left out, so no row has an empty cell. compare-data.ts builds the data on the server
// (a model list for the picker, and one small file per model). This file holds the math and the markup, so the
// server render and the page script draw the same thing. Every name is escaped.
import { score, scoreBare } from './format.ts';
import { areaSvg } from './area-shapes.ts';

export type Source = 'all' | 'ind' | 'lab';
/** A column to sort by: a fixed column, or "m:<model id>" for a model's score. */
export type SortCol = 'labs' | 'cited' | 'gap' | 'name' | `m:${string}`;
export type Cited = 'any' | 'one' | 'all';
export type View = 'table' | 'bars';
export const MAX_PICKS = 4;
/** Rows shown before the "Show all" button. */
export const SHOW_ROWS = 100;
export const SOURCES: Source[] = ['all', 'ind', 'lab'];
export const LAB_STEPS = [0, 2, 5, 10];
export const AREAS = ['knowledge', 'reasoning', 'code', 'agents', 'work', 'multimodal', 'safety', 'other'];

/** A lab's name, its mark ("c" a color logo, "m" a one-color logo, "" an initial), and its color. */
export type LabInfo = [name: string, mark: 'c' | 'm' | '', color: string];

export interface ModelIndex {
  v: 1;
  asOf: string;
  labs: Record<string, LabInfo>;
  /** id, name, lab id, release date ("" when unknown), benchmarks with a score, ECI or null. Highest ECI first. */
  models: [string, string, string, string, number, number | null][];
}

/** One benchmark in a model's file. */
export type FileRow = [
  id: string,
  name: string,
  area: string,
  unit: string,
  better: 1 | -1,
  /** Labs that report it in their launch posts and system cards: the site-wide count. */
  labs: number,
  /** The lowest and highest best score of any model, for a test that isn't a percentage. */
  lo: number,
  hi: number,
  /** The model's best independent run, and where it came from: "b" the benchmark's leaderboard, "e" Epoch AI. */
  ind: number | null,
  from: 'b' | 'e' | '',
  /** The lab's own best number. */
  lab: number | null,
  /** 1 when the model's own launch posts or system cards report it. */
  cited: 0 | 1,
];

export interface ModelFile {
  v: 1;
  id: string;
  name: string;
  lab: string;
  rows: FileRow[];
}

export interface State {
  m: string[];
  src: Source;
  sort: SortCol;
  /** True when the sort runs against the column's natural order. */
  rev: boolean;
  cited: Cited;
  /** Minimum number of labs reporting it site-wide. */
  labs: number;
  /** One area, or "" for all. */
  area: string;
  view: View;
}
export const DEFAULT_STATE: Omit<State, 'm'> = { src: 'all', sort: 'labs', rev: false, cited: 'any', labs: 0, area: '', view: 'table' };

export interface Cell {
  v: number;
  /** "b" leaderboard, "e" Epoch AI, "l" the lab's own number. */
  from: 'b' | 'e' | 'l';
}

export interface Row {
  id: string;
  name: string;
  area: string;
  unit: string;
  better: 1 | -1;
  labs: number;
  lo: number;
  hi: number;
  /** How many of the picked models' own posts report it. */
  cited: number;
  cells: Cell[];
  /** The picked models with the best score, by position. Two or more is a tie. */
  lead: number[];
  /** Best minus worst, in the test's unit. */
  gap: number;
  /** The gap on one scale for sorting: points for a percentage, a share of the test's whole range otherwise. */
  key: number;
}

export interface Result {
  n: number;
  src: Source;
  /** Every benchmark the picks share from this source, before the filters. */
  shared: number;
  /** The shared benchmarks the filters keep, in sort order. */
  rows: Row[];
  /** Per picked model, over the kept rows: benchmarks it leads alone, and benchmarks it ties for first. */
  wins: number[];
  ties: number[];
  /** Kept rows where two or more models tie for first. */
  tied: number;
  /** How many shared rows each filter option would keep, with the other filters as they are. */
  counts: { cited: Record<Cited, number>; labs: Record<number, number>; area: Record<string, number> };
  /** When the picks share nothing: the nearest thing they do share, as a sentence. */
  near: string;
}

// ---- the math ------------------------------------------------------------------------------------------

function cell(r: FileRow, src: Source): Cell | null {
  const ind = r[8];
  const lab = r[10];
  if (src === 'ind') return ind === null ? null : { v: ind, from: r[9] === 'e' ? 'e' : 'b' };
  if (src === 'lab') return lab === null ? null : { v: lab, from: 'l' };
  if (ind !== null) return { v: ind, from: r[9] === 'e' ? 'e' : 'b' };
  return lab === null ? null : { v: lab, from: 'l' };
}

/** How many benchmarks every one of these files has a score on, from this source. */
export function sharedCount(files: ModelFile[], src: Source): number {
  if (files.length < 2) return 0;
  const maps = files.slice(1).map((f) => new Map(f.rows.map((r) => [r[0], r])));
  let n = 0;
  for (const r of files[0].rows) {
    if (!cell(r, src)) continue;
    let ok = true;
    for (const m of maps) {
      const x = m.get(r[0]);
      if (!x || !cell(x, src)) {
        ok = false;
        break;
      }
    }
    if (ok) n++;
  }
  return n;
}

const listNames = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const COUNT_WORD = ['', 'one', 'two', 'three', 'four'];
/** "the two", "all three", "all four": how a sentence names every pick. */
export const allOf = (n: number) => (n === 2 ? 'the two' : `all ${COUNT_WORD[n] ?? n}`);
const fromWords: Record<Source, string> = {
  all: '',
  ind: ' in independent runs',
  lab: ' in the labs’ own numbers',
};
export const AREA_NAMES: Record<string, string> = {
  knowledge: 'Knowledge and language',
  reasoning: 'Math and science',
  code: 'Coding',
  agents: 'Agents and tools',
  work: 'Professional work',
  multimodal: 'Vision, audio and robotics',
  safety: 'Safety and security',
  other: 'Other',
};
/** The area as a word before "benchmarks" in a headline. */
const AREA_WORD: Record<string, string> = {
  knowledge: 'knowledge and language',
  reasoning: 'math and science',
  code: 'coding',
  agents: 'agent and tool',
  work: 'professional work',
  multimodal: 'vision, audio and robotics',
  safety: 'safety and security',
  other: 'other',
};

/** A score's place on its test, 0 to 100 with 100 the best: points for a percentage, a share of the range otherwise. */
function standing(v: number, r: { unit: string; better: 1 | -1; lo: number; hi: number }): number {
  const s = r.unit === '%' ? v : r.hi > r.lo ? ((v - r.lo) / (r.hi - r.lo)) * 100 : 50;
  return r.better < 0 ? 100 - s : s;
}

/** Every benchmark the picks share, unsorted and unfiltered. */
function sharedRows(files: ModelFile[], src: Source): Row[] {
  const n = files.length;
  const rows: Row[] = [];
  if (n < 2) return rows;
  const maps = files.map((f) => new Map(f.rows.map((r) => [r[0], r])));
  for (const r0 of files[0].rows) {
    const cells: Cell[] = [];
    let cited = 0;
    for (const m of maps) {
      const r = m.get(r0[0]);
      const c = r ? cell(r, src) : null;
      if (!r || !c) break;
      cells.push(c);
      cited += r[11];
    }
    // a benchmark one of the models lacks is left out, so no row has an empty cell
    if (cells.length !== n) continue;
    const [id, name, area, unit, better, labs, lo, hi] = r0;
    let best = cells[0].v;
    let worst = cells[0].v;
    for (const c of cells) {
      if (better * c.v > better * best) best = c.v;
      if (better * c.v < better * worst) worst = c.v;
    }
    // a tie is two scores that read the same at the precision the page shows
    const shown = score(best, unit);
    const lead = cells.map((c, i) => (score(c.v, unit) === shown ? i : -1)).filter((i) => i >= 0);
    const gap = Math.abs(best - worst);
    const key = unit === '%' ? gap : hi > lo ? (gap / (hi - lo)) * 100 : 0;
    rows.push({ id, name, area, unit, better, labs, lo, hi, cited, cells, lead, gap, key });
  }
  return rows;
}

const citedOk = (r: Row, c: Cited, n: number) => (c === 'any' ? true : c === 'one' ? r.cited > 0 : r.cited === n);

export function compute(files: ModelFile[], st: Omit<State, 'm' | 'view'>): Result {
  const n = files.length;
  const all = sharedRows(files, st.src);
  const keepLabs = (r: Row, k: number) => r.labs >= k;
  const keepArea = (r: Row, a: string) => !a || r.area === a;
  const rows = all.filter((r) => citedOk(r, st.cited, n) && keepLabs(r, st.labs) && keepArea(r, st.area));
  // each option's count, with the other two filters as they are
  const counts: Result['counts'] = { cited: { any: 0, one: 0, all: 0 }, labs: {}, area: {} };
  for (const k of LAB_STEPS) counts.labs[k] = 0;
  counts.area[''] = 0;
  for (const r of all) {
    const l = keepLabs(r, st.labs);
    const a = keepArea(r, st.area);
    const c = citedOk(r, st.cited, n);
    if (l && a) for (const x of ['any', 'one', 'all'] as Cited[]) if (citedOk(r, x, n)) counts.cited[x]++;
    if (c && a) for (const k of LAB_STEPS) if (r.labs >= k) counts.labs[k]++;
    if (c && l) {
      counts.area['']++;
      counts.area[r.area] = (counts.area[r.area] ?? 0) + 1;
    }
  }
  const wins = files.map(() => 0);
  const ties = files.map(() => 0);
  let tied = 0;
  for (const r of rows) {
    if (r.lead.length === 1) wins[r.lead[0]]++;
    else {
      tied++;
      for (const i of r.lead) ties[i]++;
    }
  }
  rows.sort(sorter(st.sort, st.rev, files));
  return { n, src: st.src, shared: all.length, rows, wins, ties, tied, counts, near: all.length || n < 2 ? '' : nearest(files, st.src) };
}

/** The natural order of each column: most labs, most cited, biggest gap, best score first, and names A to Z. */
function sorter(col: SortCol, rev: boolean, files: ModelFile[]): (a: Row, b: Row) => number {
  const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, 'en');
  const d = rev ? -1 : 1;
  if (col.startsWith('m:')) {
    const i = files.findIndex((f) => f.id === col.slice(2));
    if (i >= 0) return (a, b) => d * (standing(b.cells[i].v, b) - standing(a.cells[i].v, a)) || b.labs - a.labs || byName(a, b);
  }
  if (col === 'name') return (a, b) => d * byName(a, b);
  if (col === 'cited') return (a, b) => d * (b.cited - a.cited) || b.labs - a.labs || byName(a, b);
  if (col === 'gap') return (a, b) => d * (b.key - a.key) || b.labs - a.labs || byName(a, b);
  return (a, b) => d * (b.labs - a.labs) || b.cited - a.cited || byName(a, b);
}

/** For picks that share nothing: the closest thing they do share. The headline already says they share nothing. */
function nearest(files: ModelFile[], src: Source): string {
  const names = files.map((f) => f.name);
  if (src !== 'all') {
    const k = sharedCount(files, 'all');
    if (k) return `Counting ${src === 'ind' ? 'the labs’ own numbers' : 'independent runs'} too, they share ${k.toLocaleString('en-US')}.`;
  }
  if (files.length >= 3) {
    let best = { k: 0, i: -1 };
    files.forEach((_, i) => {
      const k = sharedCount(
        files.filter((__, j) => j !== i),
        src,
      );
      if (k > best.k) best = { k, i };
    });
    if (best.i >= 0) {
      const rest = names.filter((_, j) => j !== best.i);
      const them = rest.length === 2 ? listNames(rest) : `the other ${COUNT_WORD[rest.length]}`;
      return `Without ${names[best.i]}, ${them} share ${best.k.toLocaleString('en-US')}.`;
    }
  }
  const counts = files.map((f) => f.rows.filter((r) => cell(r, src)).length);
  const each = files.map((f, i) => `${f.name} has ${counts[i].toLocaleString('en-US')}`);
  return `${listNames(each)}, with no test in common.`;
}

export const filtered = (st: Pick<State, 'cited' | 'labs' | 'area'>) => st.cited !== 'any' || st.labs > 0 || !!st.area;

/** "the 14 coding benchmarks all four share, reported by 5 or more labs and cited by all four" */
function which(N: number, n: number, st: Pick<State, 'cited' | 'labs' | 'area'>): string {
  const what = `${st.area ? `${AREA_WORD[st.area] ?? st.area} ` : ''}${N === 1 ? 'benchmark' : 'benchmarks'}`;
  const clauses: string[] = [];
  if (st.labs > 0) clauses.push(`reported by ${st.labs} or more labs`);
  if (st.cited === 'one') clauses.push(n === 2 ? 'cited by at least one of the two' : 'cited by at least one of them');
  if (st.cited === 'all') clauses.push(n === 2 ? 'cited by both' : `cited by all ${COUNT_WORD[n]}`);
  return `${N === 1 ? 'the one' : `the ${N.toLocaleString('en-US')}`} ${what} ${allOf(n)} share${clauses.length ? `, ${listNames(clauses)}` : ''}`;
}

/** The headline: a finding computed from the picks and the filters. */
export function headline(res: Result, names: string[], st: Pick<State, 'cited' | 'labs' | 'area'>): string {
  const n = names.length;
  if (n === 0) return 'Pick two to four models to compare';
  if (n === 1) return `Add a model to compare with ${names[0]}`;
  const who = n === 2 ? listNames(names) : `These ${COUNT_WORD[n]} models`;
  if (!res.shared) return `${who} share no benchmarks${fromWords[res.src]}`;
  const N = res.rows.length;
  if (!N) return `${who} share ${res.shared.toLocaleString('en-US')} ${res.shared === 1 ? 'benchmark' : 'benchmarks'}${fromWords[res.src]}, and none matches these filters`;
  const most = Math.max(...res.wins);
  const set = which(N, n, st);
  if (most === 0) return N === 1 ? `${who} tie on ${set}` : `No model leads outright on any of ${set}`;
  const top = names.filter((_, i) => res.wins[i] === most);
  const of = N === 1 ? set : `${most.toLocaleString('en-US')} of ${set}`;
  return top.length === 1 ? `${top[0]} leads on ${of}` : `${listNames(top)} each lead on ${of}`;
}

/** The line under the headline: what the rows are and how ties count. */
export function sub(res: Result, st: Pick<State, 'cited' | 'labs' | 'area'>): string {
  const N = res.rows.length;
  if (res.n < 2) return 'The table lists every benchmark all the picked models have a score on.';
  if (!res.shared) return res.near;
  if (!N) {
    // the one filter whose removal brings back the most rows, counted with the other filters as they are
    const opts: [string, number][] = [];
    if (st.area) opts.push(['the area filter', res.counts.area[''] ?? 0]);
    if (st.cited !== 'any') opts.push(['the Cited by filter', res.counts.cited.any]);
    if (st.labs) opts.push(['the Labs filter', res.counts.labs[0] ?? 0]);
    const best = opts.sort((a, b) => b[1] - a[1])[0];
    return best?.[1] ? `Clearing ${best[0]} alone would show ${best[1].toLocaleString('en-US')}.` : 'Clear the filters to see them all.';
  }
  const from =
    res.src === 'ind'
      ? 'Scores from independent runs only.'
      : res.src === 'lab'
        ? 'Scores from the labs’ own posts and system cards only.'
        : 'Independent runs first. Where a model has none, its lab’s own number fills in.';
  const kept = filtered(st) ? ` The filters keep ${N.toLocaleString('en-US')} of the ${res.shared.toLocaleString('en-US')} shared benchmarks.` : '';
  const tie = res.tied ? ` At the precision shown, ${res.tied === 1 ? 'one benchmark ends' : `${res.tied.toLocaleString('en-US')} benchmarks end`} in a tie for first.` : '';
  return `${from}${kept}${tie}`;
}

// ---- the markup ----------------------------------------------------------------------------------------

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function labMark(labs: Record<string, LabInfo>, lab: string, size = 16): string {
  const l = labs[lab];
  const name = esc(l?.[0] ?? lab ?? '');
  if (l?.[1] === 'c') return `<img class="cmp-mark" src="/labs/${esc(lab)}-color.svg" width="${size}" height="${size}" alt="" title="${name}" decoding="async">`;
  if (l?.[1] === 'm') return `<span class="cmp-mark cmp-mask" style="--s:${size}px;--m:url(/labs/${esc(lab)}.svg)" title="${name}" aria-hidden="true"></span>`;
  return `<span class="cmp-mark cmp-initial" style="--s:${size}px" title="${name}" aria-hidden="true">${esc((l?.[0] ?? '?').slice(0, 1))}</span>`;
}

export interface ModelPick {
  id: string;
  name: string;
  lab: string;
}

/**
 * Each pick's color: its lab's. A second model from the same lab takes a lighter step of that color, so the two
 * stay apart; the fixed order and the lab marks in the legend carry identity too.
 */
export function colors(picks: ModelPick[], labs: Record<string, LabInfo>): string[] {
  const seen = new Map<string, number>();
  return picks.map((p) => {
    const c = labs[p.lab]?.[2] ?? 'var(--lab-other)';
    const k = seen.get(p.lab) ?? 0;
    seen.set(p.lab, k + 1);
    return k === 0 ? c : `color-mix(in srgb, ${c} ${k === 1 ? 55 : 35}%, var(--bg))`;
  });
}

/** The picked models as chips, each with a remove button. */
export function chips(picks: ModelPick[], labs: Record<string, LabInfo>): string {
  return picks
    .map(
      (p) =>
        `<li class="cmp-chip" data-id="${esc(p.id)}">${labMark(labs, p.lab)}<a href="/models/${esc(p.id)}/">${esc(p.name)}</a><button type="button" class="cmp-x" data-x="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></li>`,
    )
    .join('');
}

/** One line per model: how many kept benchmarks it leads alone, with a bar in its lab's color. */
export function winsList(res: Result, picks: ModelPick[], labs: Record<string, LabInfo>): string {
  const N = res.rows.length;
  if (res.n < 2 || !N) return '';
  const col = colors(picks, labs);
  return `<ol class="cmp-wins">${picks
    .map((p, i) => {
      const w = res.wins[i];
      const t = res.ties[i];
      const text = `${w ? `Best on ${w.toLocaleString('en-US')}` : 'Best on none'}${t ? `, tied for best on ${t.toLocaleString('en-US')}` : ''}`;
      return `<li>${labMark(labs, p.lab)}<span class="nm">${esc(p.name)}</span><span class="cmp-wbar"><span style="width:${((w / N) * 100).toFixed(1)}%;background:${col[i]}"></span></span><span class="cmp-wn">${text}</span></li>`;
    })
    .join('')}</ol>`;
}

// ---- the filter row ------------------------------------------------------------------------------------

/** Cited by, Labs and Area, each option with the number of shared benchmarks it would keep. Then Table or Bars. */
export function filterRow(res: Result, st: State): string {
  const ct = (k: number) => `<span class="ct num">${k.toLocaleString('en-US')}</span>`;
  const radio = (name: string, value: string, label: string, k: number, on: boolean) =>
    `<label${k ? '' : ' class="zero"'}><input type="radio" name="${name}" value="${value}"${on ? ' checked' : ''}>${label}${ct(k)}</label>`;
  const cited = (['any', 'one', 'all'] as Cited[])
    .map((c) => radio('cmp-cited', c, c === 'any' ? 'Any' : c === 'one' ? 'At least one of them' : 'All of them', res.counts.cited[c], st.cited === c))
    .join('');
  const labs = LAB_STEPS.map((k) => radio('cmp-labs', String(k), k ? `${k}+` : 'Any', res.counts.labs[k] ?? 0, st.labs === k)).join('');
  const areas = [
    `<label><input type="radio" name="cmp-area" value=""${st.area ? '' : ' checked'}>All${ct(res.counts.area[''] ?? 0)}</label>`,
    ...AREAS.filter((a) => (res.counts.area[a] ?? 0) > 0 || st.area === a).map(
      (a) =>
        `<label class="am" title="${esc(AREA_NAMES[a])}"><input type="radio" name="cmp-area" value="${a}"${st.area === a ? ' checked' : ''} aria-label="${esc(AREA_NAMES[a])}">${areaSvg(a, 10)}${ct(res.counts.area[a] ?? 0)}</label>`,
    ),
  ].join('');
  return `<div class="cmp-f"><span class="cmp-fl" id="cmp-fl-cited">Cited by</span><div class="seg cmp-fseg" role="radiogroup" aria-labelledby="cmp-fl-cited">${cited}</div></div><div class="cmp-f"><span class="cmp-fl" id="cmp-fl-labs">Labs</span><div class="seg cmp-fseg" role="radiogroup" aria-labelledby="cmp-fl-labs">${labs}</div></div><div class="cmp-f"><span class="cmp-fl" id="cmp-fl-area">Area</span><div class="seg cmp-fseg" role="radiogroup" aria-labelledby="cmp-fl-area">${areas}</div></div>`;
}

// ---- sortable headers ----------------------------------------------------------------------------------

const ARROW_DOWN = '<svg class="cmp-arr" width="9" height="9" viewBox="0 0 9 9" aria-hidden="true"><path d="M4.5 1.5v6M1.8 4.8l2.7 2.7 2.7-2.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_UP = '<svg class="cmp-arr" width="9" height="9" viewBox="0 0 9 9" aria-hidden="true"><path d="M4.5 7.5v-6M1.8 4.2l2.7-2.7 2.7 2.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/** The direction a column sorts in first: names A to Z, everything else biggest or best first. */
const naturalUp = (col: SortCol) => col === 'name';

/** The aria-sort value and arrow for a column, given the current sort. */
function sortState(col: SortCol, st: Pick<State, 'sort' | 'rev'>): { aria: string; arrow: string } {
  if (st.sort !== col) return { aria: '', arrow: '' };
  const up = naturalUp(col) !== st.rev;
  return { aria: up ? 'ascending' : 'descending', arrow: up ? ARROW_UP : ARROW_DOWN };
}

/** A sort button for a header. Its label says what a click does next. */
function sortButton(col: SortCol, label: string, inner: string, st: Pick<State, 'sort' | 'rev'>, cls = ''): string {
  const s = sortState(col, st);
  const next = st.sort === col ? 'Reverse the order' : 'Sort';
  return `<button type="button" class="cmp-sort${s.arrow ? ' on' : ''}${cls ? ` ${cls}` : ''}" data-sort="${esc(col)}" aria-label="${esc(`${next}: ${label}`)}">${inner}${s.arrow || '<span class="cmp-arr none" aria-hidden="true"></span>'}</button>`;
}
const INFO: Record<'labs' | 'cited' | 'gap', string> = { labs: 'What Labs counts', cited: 'What Cited by counts', gap: 'What the gap is' };
const info = (k: 'labs' | 'cited' | 'gap') => `<button type="button" class="cmp-info" popovertarget="cmp-pop-${k}" aria-label="${INFO[k]}">?</button>`;

// ---- the table -----------------------------------------------------------------------------------------

const UNIT_NAME: Record<string, string> = { elo: 'Elo', rating: 'rating', minutes: 'minutes', index: 'index', score: 'score', brier: 'Brier score', speedup: 'speedup' };
const FROM_TITLE: Record<Cell['from'], string> = { b: 'From a leaderboard', e: 'From an Epoch AI run', l: 'The lab’s own number' };
const unitNote = (r: Row) => [r.unit !== '%' ? (UNIT_NAME[r.unit] ?? r.unit) : '', r.better < 0 ? 'lower is better' : ''].filter(Boolean).join(', ');

/** The table: one row per kept benchmark, one column per model. The first SHOW_ROWS rows show at first. */
export function table(res: Result, picks: ModelPick[], labs: Record<string, LabInfo>, st: State, open: Set<string>, all = false): string {
  const N = res.rows.length;
  if (!N) return '';
  const marks = res.src === 'all';
  const th = (col: SortCol, cls: string, inner: string) => {
    const s = sortState(col, st);
    return `<th class="${cls}"${s.aria ? ` aria-sort="${s.aria}"` : ''}>${inner}</th>`;
  };
  const head = `<thead><tr>${th('name', 'bn', sortButton('name', 'benchmark name', 'Benchmark', st))}${picks
    .map((p) => th(`m:${p.id}`, 'r cm', sortButton(`m:${p.id}`, `${p.name}’s score`, `<span class="mh">${labMark(labs, p.lab, 14)}<span>${esc(p.name)}</span></span>`, st, 'r')))
    .join('')}${th('labs', 'r', `<span class="hw">${sortButton('labs', 'labs reporting it', 'Labs', st, 'r')}${info('labs')}</span>`)}${th('cited', 'r', `<span class="hw">${sortButton('cited', 'cited by these models', 'Cited by', st, 'r')}${info('cited')}</span>`)}${th('gap', 'r', `<span class="hw">${sortButton('gap', 'gap', 'Gap', st, 'r')}${info('gap')}</span>`)}</tr></thead>`;
  const cols = picks.length + 4;
  const body = res.rows
    .map((r, i) => {
      const later = !all && i >= SHOW_ROWS;
      const note = unitNote(r);
      const unit = note ? `<span class="u">${esc(note)}</span>` : '';
      const cells = r.cells
        .map((c, j) => {
          const lead = r.lead.includes(j);
          const v = scoreBare(c.v, r.unit);
          const own = marks ? `<i class="own${c.from === 'l' ? '' : ' no'}" aria-hidden="true"></i>${c.from === 'l' ? '<span class="sr"> (the lab’s own number)</span>' : ''}` : '';
          return `<td class="r num${lead ? ' lead' : ''}" title="${FROM_TITLE[c.from]}">${lead ? `<b>${v}</b>` : v}${own}</td>`;
        })
        .join('');
      const gap = r.unit === '%' ? r.gap.toFixed(1) : scoreBare(r.gap, r.unit);
      const isOpen = open.has(r.id);
      const hide = later ? ' hidden' : '';
      const row = `<tr data-id="${esc(r.id)}" class="cmp-row${later ? ' later' : ''}${isOpen ? ' open' : ''}"${hide}><td class="bn"><span class="bw"><button type="button" class="cmp-dis" data-dis="${esc(r.id)}" aria-expanded="${isOpen}" aria-controls="cmp-d-${esc(r.id)}" aria-label="Show the bars for ${esc(r.name)}"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M3.5 2l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${areaSvg(r.area, 10)}<span class="bt"><a href="/benchmarks/${esc(r.id)}/">${esc(r.name)}</a>${unit}</span></span></td>${cells}<td class="r num muted">${r.labs}</td><td class="r num muted">${r.cited} of ${res.n}</td><td class="r num muted">${gap}</td></tr>`;
      const det = isOpen ? `<tr class="cmp-det${later ? ' later' : ''}" data-det="${esc(r.id)}" id="cmp-d-${esc(r.id)}"${hide}><td colspan="${cols}">${detail(r, picks, labs, res)}</td></tr>` : '';
      return row + det;
    })
    .join('');
  const more = !all && N > SHOW_ROWS ? `<button type="button" class="more-rows" data-all>Show all ${N.toLocaleString('en-US')} benchmarks</button>` : '';
  return `<div class="cmp-tbox"><table class="t cmp-t">${head}<tbody>${body}</tbody></table></div>${more}`;
}

// ---- one benchmark's bars ------------------------------------------------------------------------------

/** A gap in words: "5.8 points", "12 Elo points", "0.05". */
function gapWords(d: number, unit: string): string {
  if (unit === '%') return `${d.toFixed(1)} ${d.toFixed(1) === '1.0' ? 'point' : 'points'}`;
  if (unit === 'elo') return `${Math.round(d).toLocaleString('en-US')} Elo points`;
  if (unit === 'rating') return `${Math.round(d).toLocaleString('en-US')} rating points`;
  if (unit === 'index') return `${d.toFixed(1)} index points`;
  return score(d, unit);
}

/** The x axis a row's bars share: 0 to 100 for a percentage, the test's own range otherwise. */
export function domain(r: Pick<Row, 'unit' | 'lo' | 'hi'>): [number, number] {
  if (r.unit === '%') return [0, 100];
  const span = r.hi - r.lo || Math.abs(r.hi) || 1;
  return [r.lo - span * 0.06, r.hi + (r.hi === r.lo ? span * 0.06 : 0)];
}
const at = (v: number, [a, b]: [number, number]) => Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));

/** The sentence a row's bars open with, computed from the row. */
export function rowSentence(r: Row, picks: ModelPick[], src: Source): string {
  const n = r.cells.length;
  const names = picks.map((p) => p.name);
  const order = r.cells.map((c, i) => ({ v: c.v, i })).sort((a, b) => r.better * (b.v - a.v));
  const out: string[] = [];
  if (r.lead.length === n) out.push(`${n === 2 ? 'Both' : `All ${COUNT_WORD[n]}`} score ${score(order[0].v, r.unit)}.`);
  else if (r.lead.length > 1) out.push(`${listNames(r.lead.map((i) => names[i]))} tie for first at ${score(order[0].v, r.unit)}.`);
  else {
    const runner = order.find((x) => x.i !== r.lead[0])!;
    out.push(`${names[r.lead[0]]} leads ${names[runner.i]} by ${gapWords(Math.abs(order[0].v - runner.v), r.unit)}.`);
  }
  if (n > 2 && r.lead.length < n) out.push(`The best and the worst are ${gapWords(r.gap, r.unit)} apart.`);
  const own = r.cells.map((c, i) => (c.from === 'l' ? names[i] : '')).filter(Boolean);
  if (src === 'lab' || own.length === n) out.push(n === 2 ? 'Both scores are the labs’ own numbers.' : 'All the scores are the labs’ own numbers.');
  else if (!own.length) out.push(n === 2 ? 'Both scores are independent runs.' : 'All the scores are independent runs.');
  else out.push(`${listNames(own)} ${own.length === 1 ? 'has its lab’s own number' : 'have their labs’ own numbers'}. The rest are independent runs.`);
  return out.join(' ');
}

/** The open row: one bar per model on a shared axis, the gap as a bracket, a sentence and a link. */
export function detail(r: Row, picks: ModelPick[], labs: Record<string, LabInfo>, res: Pick<Result, 'src'>): string {
  const col = colors(picks, labs);
  const dom = domain(r);
  const best = r.cells.reduce((m, c) => (r.better * c.v > r.better * m ? c.v : m), r.cells[0].v);
  const worst = r.cells.reduce((m, c) => (r.better * c.v < r.better * m ? c.v : m), r.cells[0].v);
  const bars = r.cells
    .map((c, i) => {
      const lead = r.lead.includes(i);
      const v = score(c.v, r.unit);
      return `<span class="cmp-dn">${labMark(labs, picks[i].lab, 14)}<span>${esc(picks[i].name)}</span></span><span class="cmp-dt"><span class="cmp-df" style="width:${at(c.v, dom).toFixed(2)}%;background:${col[i]}" data-tv="${esc(v)}" data-tn="${esc(picks[i].name)}" data-ts="${esc(FROM_TITLE[c.from])}"></span></span><span class="cmp-dv num${lead ? ' lead' : ''}">${lead ? `<b>${esc(v)}</b>` : esc(v)}${c.from === 'l' ? '<i class="own" aria-hidden="true"></i><span class="sr"> (the lab’s own number)</span>' : ''}</span>`;
    })
    .join('');
  const x0 = Math.min(at(best, dom), at(worst, dom));
  const x1 = Math.max(at(best, dom), at(worst, dom));
  const bracket =
    r.gap > 0
      ? `<span></span><span class="cmp-gb"><span class="cmp-gbr" style="left:${x0.toFixed(2)}%;width:${Math.max(0.4, x1 - x0).toFixed(2)}%"></span><span class="cmp-gbl" style="left:${((x0 + x1) / 2).toFixed(2)}%">Gap ${esc(gapWords(r.gap, r.unit))}</span></span><span></span>`
      : '';
  const ticks =
    r.unit === '%'
      ? [0, 25, 50, 75, 100].map((t) => `<span style="left:${t}%">${t}</span>`).join('')
      : `<span style="left:0%">${esc(score(dom[0], r.unit))}</span><span style="left:100%">${esc(score(dom[1], r.unit))}</span>`;
  const scale =
    r.unit === '%'
      ? r.better < 0
        ? 'Lower is better, so the shortest bar leads.'
        : ''
      : `The axis runs over the range of every model’s best score here, in ${esc(UNIT_NAME[r.unit] ?? r.unit)}.${r.better < 0 ? ' Lower is better, so the shortest bar leads.' : ''}`;
  return `<div class="cmp-detin"><p class="cmp-ds">${esc(rowSentence(r, picks, res.src))}</p><div class="cmp-dbars${r.unit === '%' ? ' pct' : ''}" role="img" aria-label="${esc(r.cells.map((c, i) => `${picks[i].name} ${score(c.v, r.unit)}`).join(', '))}">${bars}${bracket}<span></span><span class="cmp-dx">${ticks}</span><span></span></div><p class="cmp-dfoot">${scale ? `${scale} ` : ''}<a href="/benchmarks/${esc(r.id)}/">Open the ${esc(r.name)} page</a></p></div>`;
}

// ---- the Bars view -------------------------------------------------------------------------------------

/** Every kept benchmark as a small group of thin bars, one per model, in the current sort order. */
export function barsView(res: Result, picks: ModelPick[], labs: Record<string, LabInfo>, st: State, all = false): string {
  const N = res.rows.length;
  if (!N) return '';
  const col = colors(picks, labs);
  const legend = picks
    .map((p, i) =>
      sortButton(
        `m:${p.id}`,
        `${p.name}’s score`,
        `<span class="cmp-swatch" style="background:${col[i]}"></span>${labMark(labs, p.lab, 14)}<span>${esc(p.name)}</span>`,
        st,
        'cmp-leg',
      ),
    )
    .join('');
  const sorts = `${sortButton('name', 'benchmark name', 'Benchmark', st)}<span class="hw">${sortButton('labs', 'labs reporting it', 'Labs', st)}${info('labs')}</span><span class="hw">${sortButton('cited', 'cited by these models', 'Cited by', st)}${info('cited')}</span><span class="hw">${sortButton('gap', 'gap', 'Gap', st)}${info('gap')}</span>`;
  const anyPct = res.rows.some((r) => r.unit === '%');
  const axis = anyPct ? `<div class="cmp-bax" aria-hidden="true"><span></span><span class="cmp-baxt">${[0, 25, 50, 75, 100].map((t) => `<span style="left:${t}%">${t}</span>`).join('')}</span></div>` : '';
  let tab = true;
  const groups = res.rows
    .map((r, k) => {
      const later = !all && k >= SHOW_ROWS;
      const dom = domain(r);
      const note = [r.unit !== '%' ? `${UNIT_NAME[r.unit] ?? r.unit}, its own scale` : '', r.better < 0 ? 'lower is better' : ''].filter(Boolean).join(', ');
      const lead = r.lead.length === 1 ? r.lead[0] : -1;
      const bars = r.cells
        .map((c, i) => {
          const v = score(c.v, r.unit);
          const t = tab && !later ? '0' : '-1';
          if (!later) tab = false;
          return `<span class="cmp-bb" tabindex="${t}" data-tv="${esc(v)}" data-tn="${esc(picks[i].name)}" data-ts="${esc(`${r.name}. ${FROM_TITLE[c.from]}.`)}"><span class="cmp-bf" style="width:${at(c.v, dom).toFixed(2)}%;background:${col[i]}"></span>${i === lead || (lead < 0 && r.lead[0] === i) ? `<span class="cmp-bl num">${esc(v)}${r.lead.length > 1 ? ', tied' : ''}</span>` : ''}</span>`;
        })
        .join('');
      return `<li class="cmp-bg${later ? ' later' : ''}" data-id="${esc(r.id)}"${later ? ' hidden' : ''}><span class="cmp-bn">${areaSvg(r.area, 10)}<span class="bt"><a href="/benchmarks/${esc(r.id)}/">${esc(r.name)}</a>${note ? `<span class="u">${esc(note)}</span>` : ''}</span></span><span class="cmp-bbs">${bars}</span></li>`;
    })
    .join('');
  const more = !all && N > SHOW_ROWS ? `<button type="button" class="more-rows" data-all>Show all ${N.toLocaleString('en-US')} benchmarks</button>` : '';
  return `<div class="cmp-bars"><div class="cmp-bhead"><div class="cmp-legend-row" role="group" aria-label="Models, in bar order. Click one to sort by its score.">${legend}</div><div class="cmp-bsorts" role="group" aria-label="Sort">${sorts}</div></div>${axis}<ol class="cmp-blist" aria-label="Scores on each benchmark">${groups}</ol>${more}</div>`;
}

/** The legend line under the table or the bars. */
export function legend(res: Result, view: View): string {
  if (!res.rows.length) return '';
  const own = view === 'table' && res.src === 'all' && res.rows.some((r) => r.cells.some((c) => c.from === 'l')) ? '<span><i class="own" aria-hidden="true"></i>A lab’s own number. The rest are independent runs.</span>' : '';
  return view === 'table'
    ? `${own}<span>Scores are percentages unless the row says otherwise. Bold marks the best in each row. Click a row to see its bars.</span>`
    : '<span>Percentage tests share the 0 to 100 axis at the top. Other tests use their own scale, from the lowest to the highest model on that test. The value labels the leader.</span>';
}

// ---- the address ---------------------------------------------------------------------------------------

/** ?m=a,b&src=ind&sort=gap-asc&cited=all&labs=5&area=code&view=bars. Unknown ids drop out, a repeat counts once, four stay. */
export function readState(search: string, fallback: State, known: (id: string) => boolean): State {
  const q = new URLSearchParams(search);
  const raw = q.get('m');
  let m = fallback.m;
  if (raw !== null) {
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter((id, i, xs) => id && known(id) && xs.indexOf(id) === i)
      .slice(0, MAX_PICKS);
    if (ids.length) m = ids;
  }
  const src = q.get('src') as Source;
  let sort: SortCol = fallback.sort;
  let rev = fallback.rev;
  const s = q.get('sort');
  if (s) {
    const dir = s.match(/-(asc|desc)$/)?.[1];
    const col = (dir ? s.slice(0, -(dir.length + 1)) : s) as SortCol;
    const okCol = ['labs', 'cited', 'gap', 'name'].includes(col) || (col.startsWith('m:') && m.includes(col.slice(2)));
    if (okCol) {
      sort = col;
      rev = dir ? (dir === 'asc') !== naturalUp(col) : false;
    }
  }
  const cited = q.get('cited') as Cited;
  const labs = Number(q.get('labs'));
  const area = q.get('area') ?? '';
  return {
    m,
    src: SOURCES.includes(src) ? src : fallback.src,
    sort,
    rev,
    cited: cited === 'one' || cited === 'all' ? cited : 'any',
    labs: LAB_STEPS.includes(labs) ? labs : 0,
    area: AREAS.includes(area) ? area : '',
    view: q.get('view') === 'bars' ? 'bars' : 'table',
  };
}

export function writeState(st: State): string {
  const q = new URLSearchParams();
  if (st.m.length) q.set('m', st.m.join(','));
  if (st.src !== 'all') q.set('src', st.src);
  if (st.sort !== 'labs' || st.rev) {
    const up = naturalUp(st.sort) !== st.rev;
    q.set('sort', st.rev ? `${st.sort}-${up ? 'asc' : 'desc'}` : st.sort);
  }
  if (st.cited !== 'any') q.set('cited', st.cited);
  if (st.labs) q.set('labs', String(st.labs));
  if (st.area) q.set('area', st.area);
  if (st.view !== 'table') q.set('view', st.view);
  return `?${q.toString().replace(/%2C/g, ',').replace(/%3A/g, ':')}`;
}
