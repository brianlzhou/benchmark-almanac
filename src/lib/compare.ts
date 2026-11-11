// The Compare page: two to four models side by side, on every benchmark all of them have a score on. A test that
// any picked model lacks is left out, so no row has an empty cell. compare-data.ts builds the data on the server
// (a model list for the picker, and one small file per model). This file holds the math and the markup, so the
// server render and the page script draw the same thing. Every name is escaped.
import { score, scoreBare } from './format.ts';
import { areaSvg } from './area-shapes.ts';

export type Source = 'all' | 'ind' | 'lab';
export type SortKey = 'labs' | 'cited' | 'gap' | 'name';
export const MAX_PICKS = 4;
/** Rows shown before the "Show all" button. */
export const SHOW_ROWS = 100;
export const SOURCES: Source[] = ['all', 'ind', 'lab'];
export const SORTS: SortKey[] = ['labs', 'cited', 'gap', 'name'];

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
  /** The lowest and highest best score of any model, for the gap on a test that isn't a percentage. */
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
  sort: SortKey;
}

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
  rows: Row[];
  /** Per picked model: benchmarks it leads alone, and benchmarks it ties for first. */
  wins: number[];
  ties: number[];
  /** Rows where two or more models tie for first. */
  tied: number;
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

export function compute(files: ModelFile[], src: Source, sort: SortKey): Result {
  const n = files.length;
  const wins = files.map(() => 0);
  const ties = files.map(() => 0);
  const rows: Row[] = [];
  let tied = 0;
  if (n >= 2) {
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
      if (lead.length === 1) wins[lead[0]]++;
      else {
        tied++;
        if (lead.length < n) for (const i of lead) ties[i]++;
      }
      const gap = Math.abs(best - worst);
      const key = unit === '%' ? gap : hi > lo ? (gap / (hi - lo)) * 100 : 0;
      rows.push({ id, name, area, unit, better, labs, cited, cells, lead: lead.length === n ? [] : lead, gap, key });
    }
  }
  const byName = (a: Row, b: Row) => a.name.localeCompare(b.name, 'en');
  const order: Record<SortKey, (a: Row, b: Row) => number> = {
    labs: (a, b) => b.labs - a.labs || b.cited - a.cited || byName(a, b),
    cited: (a, b) => b.cited - a.cited || b.labs - a.labs || byName(a, b),
    gap: (a, b) => b.key - a.key || b.labs - a.labs || byName(a, b),
    name: byName,
  };
  rows.sort(order[sort]);
  return { n, src, rows, wins, ties, tied, near: rows.length || n < 2 ? '' : nearest(files, src) };
}

/** For picks that share nothing: the closest thing they do share. */
function nearest(files: ModelFile[], src: Source): string {
  const names = files.map((f) => f.name);
  const who = files.length === 2 ? listNames(names) : `These ${COUNT_WORD[files.length]} models`;
  if (src !== 'all') {
    const k = sharedCount(files, 'all');
    if (k) return `${who} share no benchmarks${fromWords[src]}. Counting ${src === 'ind' ? 'the labs’ own numbers' : 'independent runs'} too, they share ${k.toLocaleString('en-US')}.`;
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
      return `${who} share no benchmarks${fromWords[src]}. Without ${names[best.i]}, ${them} share ${best.k.toLocaleString('en-US')}.`;
    }
  }
  const counts = files.map((f) => f.rows.filter((r) => cell(r, src)).length);
  const each = files.map((f, i) => `${f.name} has ${counts[i].toLocaleString('en-US')}`);
  return `${who} share no benchmarks${fromWords[src]}. ${listNames(each)}, with no test in common.`;
}

/** The headline: a finding computed from the picks. */
export function headline(res: Result, names: string[]): string {
  const n = names.length;
  if (n === 0) return 'Pick two to four models to compare';
  if (n === 1) return `Add a model to compare with ${names[0]}`;
  const who = n === 2 ? listNames(names) : `These ${COUNT_WORD[n]} models`;
  const N = res.rows.length;
  if (!N) return `${who} share no benchmarks${fromWords[res.src]}`;
  const most = Math.max(...res.wins);
  const of = N === 1 ? `the one benchmark ${allOf(n)} share` : `${most.toLocaleString('en-US')} of the ${N.toLocaleString('en-US')} benchmarks ${allOf(n)} share`;
  if (most === 0) return N === 1 ? `${who} tie on the one benchmark they share` : `No model leads outright on any of the ${N.toLocaleString('en-US')} benchmarks ${allOf(n)} share`;
  const top = names.filter((_, i) => res.wins[i] === most);
  if (top.length === 1) return `${top[0]} leads on ${of}`;
  return `${listNames(top)} each lead on ${of}`;
}

/** The line under the headline: what the rows are and how ties count. */
export function sub(res: Result): string {
  const N = res.rows.length;
  if (res.n < 2) return 'The table lists every benchmark all the picked models have a score on.';
  if (!N) return res.near;
  const from =
    res.src === 'ind'
      ? 'Scores from independent runs only.'
      : res.src === 'lab'
        ? 'Scores from the labs’ own posts and system cards only.'
        : 'Independent runs first. Where a model has none, its lab’s own number fills in.';
  const tie = res.tied ? ` ${res.tied.toLocaleString('en-US')} ${res.tied === 1 ? 'benchmark ends' : 'benchmarks end'} in a tie for first, at the precision shown.` : '';
  return `${from}${tie}`;
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
const labColor = (labs: Record<string, LabInfo>, lab: string) => labs[lab]?.[2] ?? 'var(--lab-other)';

export interface Pick {
  id: string;
  name: string;
  lab: string;
}

/** The picked models as chips, each with a remove button. */
export function chips(picks: Pick[], labs: Record<string, LabInfo>): string {
  return picks
    .map(
      (p) =>
        `<li class="cmp-chip" data-id="${esc(p.id)}">${labMark(labs, p.lab)}<a href="/models/${esc(p.id)}/">${esc(p.name)}</a><button type="button" class="cmp-x" data-x="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></li>`,
    )
    .join('');
}

/** One line per model: how many benchmarks it leads alone, with a bar in its lab's color. */
export function winsList(res: Result, picks: Pick[], labs: Record<string, LabInfo>): string {
  const N = res.rows.length;
  if (res.n < 2 || !N) return '';
  return `<ol class="cmp-wins">${picks
    .map((p, i) => {
      const w = res.wins[i];
      const t = res.ties[i];
      const text = `${w ? `Best on ${w.toLocaleString('en-US')}` : 'Best on none'}${t ? `, tied for best on ${t.toLocaleString('en-US')}` : ''}`;
      return `<li>${labMark(labs, p.lab)}<span class="nm">${esc(p.name)}</span><span class="cmp-wbar"><span style="width:${((w / N) * 100).toFixed(1)}%;background:${labColor(labs, p.lab)}"></span></span><span class="cmp-wn">${text}</span></li>`;
    })
    .join('')}</ol>`;
}

const UNIT_NAME: Record<string, string> = { elo: 'Elo', rating: 'rating', minutes: 'minutes', index: 'index', score: 'score', brier: 'Brier score', speedup: 'speedup' };
const FROM_TITLE: Record<Cell['from'], string> = { b: 'From its leaderboard', e: 'From an Epoch AI run', l: 'The lab’s own number' };

/** The table: one row per shared benchmark, one column per model. The first SHOW_ROWS rows show at first. */
export function table(res: Result, picks: Pick[], labs: Record<string, LabInfo>, all = false): string {
  const N = res.rows.length;
  if (!N) return '';
  const marks = res.src === 'all';
  const head = `<thead><tr><th class="bn">Benchmark</th>${picks
    .map((p) => `<th class="r cm"><span class="mh">${labMark(labs, p.lab, 14)}<span>${esc(p.name)}</span></span></th>`)
    .join('')}<th class="r" title="Labs that report it in their launch posts and system cards">Labs</th><th class="r" title="How many of these models’ own posts and system cards report it">Cited by</th><th class="r" title="Best minus worst, in the test’s unit">Gap</th></tr></thead>`;
  const body = res.rows
    .map((r, i) => {
      const later = !all && i >= SHOW_ROWS;
      const unit = r.unit !== '%' || r.better < 0 ? `<span class="u">${esc([r.unit !== '%' ? (UNIT_NAME[r.unit] ?? r.unit) : '', r.better < 0 ? 'lower is better' : ''].filter(Boolean).join(', '))}</span>` : '';
      const cells = r.cells
        .map((c, j) => {
          const lead = r.lead.includes(j);
          const v = scoreBare(c.v, r.unit);
          const own = marks ? `<i class="own${c.from === 'l' ? '' : ' no'}" aria-hidden="true"></i>${c.from === 'l' ? '<span class="sr"> (the lab’s own number)</span>' : ''}` : '';
          return `<td class="r num${lead ? ' lead' : ''}" title="${FROM_TITLE[c.from]}">${lead ? `<b>${v}</b>` : v}${own}</td>`;
        })
        .join('');
      const gap = r.unit === '%' ? r.gap.toFixed(1) : scoreBare(r.gap, r.unit);
      return `<tr data-id="${esc(r.id)}"${later ? ' class="later" hidden' : ''}><td class="bn"><span class="bw">${areaSvg(r.area, 9)}<span class="bt"><a href="/benchmarks/${esc(r.id)}/">${esc(r.name)}</a>${unit}</span></span></td>${cells}<td class="r num muted">${r.labs}</td><td class="r num muted">${r.cited} of ${res.n}</td><td class="r num muted">${gap}</td></tr>`;
    })
    .join('');
  const more = !all && N > SHOW_ROWS ? `<button type="button" class="more-rows" data-all>Show all ${N.toLocaleString('en-US')} benchmarks</button>` : '';
  return `<div class="cmp-tbox"><table class="t cmp-t">${head}<tbody>${body}</tbody></table></div>${more}`;
}

/** The legend line under the table. */
export function legend(res: Result): string {
  if (!res.rows.length) return '';
  const own = res.src === 'all' && res.rows.some((r) => r.cells.some((c) => c.from === 'l')) ? '<span><i class="own" aria-hidden="true"></i>A lab’s own number. The rest are independent runs.</span>' : '';
  return `${own}<span>Scores are percentages unless the row says otherwise. Bold marks the best in each row.</span>`;
}

// ---- the address ---------------------------------------------------------------------------------------

/** ?m=a,b,c&src=ind&sort=gap. Unknown ids drop out, a repeated id counts once, and only the first four stay. */
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
  const sort = q.get('sort') as SortKey;
  return { m, src: SOURCES.includes(src) ? src : fallback.src, sort: SORTS.includes(sort) ? sort : fallback.sort };
}

export function writeState(st: State): string {
  const q = new URLSearchParams();
  if (st.m.length) q.set('m', st.m.join(','));
  if (st.src !== 'all') q.set('src', st.src);
  if (st.sort !== 'labs') q.set('sort', st.sort);
  return `?${q.toString().replace(/%2C/g, ',')}`;
}
